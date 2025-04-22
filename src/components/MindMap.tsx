import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { 
  Plus, X, Edit, Trash2, Link, ArrowRight, ZoomIn, ZoomOut, 
  Move, Maximize, MinusCircle, PlusCircle, Share2, Download,
  Layout, Search, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MindMapProps {
  onNoteSelect: (noteId: string) => void;
  onCreateNote: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  user_id: string;
  linked_notes?: string[];
  folder_id?: string;
}

interface MindMapNode {
  id: string;
  title: string;
  x: number;
  y: number;
  color?: string;
  tags?: string[];
  content?: string;
  created_at?: string;
  user_id?: string;
}

interface Connection {
  source: string;
  target: string;
}

const COLORS = [
  'from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600',
  'from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-600',
  'from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600',
  'from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-600',
  'from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600',
  'from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600',
];

const LAYOUTS = {
  RADIAL: 'radial',
  TREE: 'tree',
  FORCE: 'force',
  GRID: 'grid',
};

const MindMap: React.FC<MindMapProps> = ({ onNoteSelect, onCreateNote }) => {
  const { t } = useLanguage();
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingMode, setConnectingMode] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [layout, setLayout] = useState(LAYOUTS.RADIAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInitialized, setViewInitialized] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showToolbar, setShowToolbar] = useState(true);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Initialize view on first load
  useEffect(() => {
    if (!viewInitialized && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setPosition({
        x: rect.width / 2,
        y: rect.height / 2
      });
      setViewInitialized(true);
    }
  }, [viewInitialized]);

  // Reset position when layout changes
  useEffect(() => {
    if (svgRef.current && nodes.length > 0) {
      const rect = svgRef.current.getBoundingClientRect();
      setPosition({
        x: rect.width / 2,
        y: rect.height / 2
      });
    }
  }, [layout]);

  const calculateNodePosition = (index: number, total: number, layout: string) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    const sidebarWidth = 288; // Width of the sidebar
    const topNavHeight = 64; // Height of the top navigation
    const padding = 100; // Increased padding for better visibility
    
    // Calculate available space
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;
    
    // Calculate center position
    const centerX = availableWidth / 2;
    const centerY = availableHeight / 2;
    
    // Calculate radius based on available space and number of nodes
    const radius = Math.min(availableWidth, availableHeight) * 0.35;
    const minDistance = Math.max(160, radius / (total || 1)); // Minimum distance between nodes

    switch (layout) {
      case LAYOUTS.RADIAL:
        const angle = (2 * Math.PI * index) / total;
        return {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      case LAYOUTS.GRID:
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        const gridSpacing = Math.min(availableWidth / cols, availableHeight / Math.ceil(total / cols)) * 0.8;
        return {
          x: padding + (col + 0.5) * gridSpacing,
          y: padding + (row + 0.5) * gridSpacing
        };
      case LAYOUTS.TREE:
        const levels = Math.ceil(Math.log2(total + 1));
        const level = Math.floor(Math.log2(index + 1));
        const position = index - Math.pow(2, level) + 1;
        const totalInLevel = Math.min(Math.pow(2, level), total - Math.pow(2, level) + 1);
        const levelSpacing = (availableHeight - padding * 2) / (levels + 1);
        const nodeSpacing = (availableWidth - padding * 2) / Math.pow(2, level);
        return {
          x: padding + (position + 0.5) * nodeSpacing,
          y: padding + (level + 1) * levelSpacing
        };
      default:
        return { x: centerX, y: centerY };
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error(t('error.auth.required'));
      }
      
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (notesError) throw notesError;

      if (notesData) {
        // Filter notes based on search term
        const filteredNotes = searchTerm
          ? notesData.filter(note => 
              note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : notesData;

        const newNodes: MindMapNode[] = filteredNotes.map((note: Note, index: number) => {
          const position = calculateNodePosition(index, filteredNotes.length, layout);
          return {
            id: note.id,
            title: note.title || t('untitled_note'),
            x: position.x,
            y: position.y,
            color: COLORS[index % COLORS.length],
            tags: note.tags || [],
            content: note.content,
            created_at: note.created_at,
            user_id: note.user_id
          };
        });
        
        const newConnections: Connection[] = [];
        filteredNotes.forEach((note: Note) => {
          if (note.linked_notes && Array.isArray(note.linked_notes)) {
            note.linked_notes.forEach(targetId => {
              if (filteredNotes.some(n => n.id === targetId)) {
                newConnections.push({
                  source: note.id,
                  target: targetId
                });
              }
            });
          }
        });
        
        setNodes(newNodes);
        setConnections(newConnections);
      }
    } catch (error: any) {
      console.error('Error fetching notes:', error.message);
      toast.error(t('error.notes.fetch'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes when search term or layout changes
  useEffect(() => {
    fetchNotes();
  }, [searchTerm, layout]);
  
  const handleNodeDrag = (id: string, newX: number, newY: number) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, x: newX, y: newY } : node
    ));
  };
  
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  
  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMapMouseUp = () => {
    setDragging(false);
  };
  
  const handleCreateConnection = async (sourceId: string, targetId: string) => {
    try {
      // First, check if the connection already exists
      const exists = connections.some(
        conn => conn.source === sourceId && conn.target === targetId
      );
      
      if (exists) {
        toast.error(t('error.connection.exists') || 'Connection already exists');
        return;
      }
      
      // Get source note
      const { data: sourceNote, error: sourceError } = await supabase
        .from('notes')
        .select('linked_notes')
        .eq('id', sourceId)
        .single();
        
      if (sourceError) throw sourceError;
      
      // Update source note linked_notes array
      const linked = sourceNote.linked_notes || [];
      if (!linked.includes(targetId)) {
        const updatedLinks = [...linked, targetId];
        
        const { error: updateError } = await supabase
          .from('notes')
          .update({ 
            linked_notes: updatedLinks,
            updated_at: new Date().toISOString()
          })
          .eq('id', sourceId);
          
        if (updateError) throw updateError;
        
        // Add to connections in state
        setConnections([...connections, { source: sourceId, target: targetId }]);
        toast.success(t('success.connection.created') || 'Connection created');
      }
    } catch (error: any) {
      console.error('Error creating connection:', error.message);
      toast.error(t('error.connection.create') || 'Failed to create connection');
    }
  };
  
  const handleDeleteConnection = async (source: string, target: string) => {
    try {
      // Get source note
      const { data: sourceNote, error: sourceError } = await supabase
        .from('notes')
        .select('linked_notes')
        .eq('id', source)
        .single();
        
      if (sourceError) throw sourceError;
      
      // Remove target from linked_notes
      const linked = sourceNote.linked_notes || [];
      const updatedLinks = linked.filter((id: string) => id !== target);
      
      const { error: updateError } = await supabase
        .from('notes')
        .update({ 
          linked_notes: updatedLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', source);
        
      if (updateError) throw updateError;
      
      // Remove from connections in state
      setConnections(connections.filter(
        conn => !(conn.source === source && conn.target === target)
      ));
      
      toast.success(t('success.connection.deleted') || 'Connection deleted');
    } catch (error: any) {
      console.error('Error deleting connection:', error.message);
      toast.error(t('error.connection.delete') || 'Failed to delete connection');
    }
  };
  
  const handleNodeClick = (id: string) => {
    if (connectingMode) {
      if (connectSource === null) {
        // Start connection
        setConnectSource(id);
      } else if (connectSource !== id) {
        // Complete connection
        handleCreateConnection(connectSource, id);
        setConnectSource(null);
        setConnectingMode(false);
      }
    } else {
      setSelectedNode(id === selectedNode ? null : id);
    }
  };
  
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const applyLayout = (nodes: MindMapNode[]) => {
    switch (layout) {
      case LAYOUTS.RADIAL:
        return nodes.map((node, i) => ({
          ...node,
          x: Math.cos(2 * Math.PI * i / nodes.length) * 300 + 400,
          y: Math.sin(2 * Math.PI * i / nodes.length) * 300 + 300
        }));
      case LAYOUTS.TREE:
        return nodes.map((node, i) => ({
          ...node,
          x: (i % 3) * 300 + 200,
          y: Math.floor(i / 3) * 200 + 100
        }));
      default:
        return nodes;
    }
  };

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = filterTags.length === 0 || 
      (node.tags && node.tags.some(tag => filterTags.includes(tag)));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="h-full flex flex-col bg-[#0f1117]">
      {/* Top Navigation */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-800">
            <button
              onClick={zoomOut}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800
                transition-colors duration-200"
              title={t('zoom_out')}
            >
              <ZoomOut size={18} />
            </button>
            <span className="w-16 text-center text-sm text-gray-400">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800
                transition-colors duration-200"
              title={t('zoom_in')}
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Layout Controls */}
          <div className="flex items-center gap-1">
            {Object.entries(LAYOUTS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setLayout(value)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  layout === value
                    ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
                title={t(`layout.${key.toLowerCase()}`)}
              >
                <Layout size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_notes')}
            className="w-full px-4 py-2 pl-10 rounded-lg
              bg-gray-900/50 border border-gray-800
              text-gray-300 placeholder-gray-500
              focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
              transition-all duration-200"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1117]/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-400 font-medium">{t('loading_notes')}</p>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={handleMapMouseDown}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onMouseLeave={handleMapMouseUp}
          >
            <defs>
              {/* Glowing Effect Filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Connection Gradient */}
              <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2"/>
              </linearGradient>

              {/* Arrow Marker */}
              <marker
                id="arrowhead"
                markerWidth="20"
                markerHeight="16"
                refX="18"
                refY="8"
                orient="auto"
              >
                <path
                  d="M0,0 L20,8 L0,16"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>

            <g transform={`translate(${position.x},${position.y}) scale(${scale})`}>
              {/* Connections */}
              {connections.map(({ source, target }) => {
                const sourceNode = nodes.find(n => n.id === source);
                const targetNode = nodes.find(n => n.id === target);
                if (!sourceNode || !targetNode) return null;

                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate curved path
                const curvature = 0.3;
                const controlPoint1 = {
                  x: sourceNode.x + dx * 0.25,
                  y: sourceNode.y + dy * 0.25 - distance * curvature
                };
                const controlPoint2 = {
                  x: sourceNode.x + dx * 0.75,
                  y: sourceNode.y + dy * 0.75 + distance * curvature
                };

                return (
                  <g key={`${source}-${target}`} className="transition-opacity duration-300">
                    {/* Connection Path */}
                    <path
                      d={`M ${sourceNode.x} ${sourceNode.y} 
                         C ${controlPoint1.x} ${controlPoint1.y},
                           ${controlPoint2.x} ${controlPoint2.y},
                           ${targetNode.x} ${targetNode.y}`}
                      className="stroke-indigo-500/20"
                      strokeWidth="3"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      filter="url(#glow)"
                    />
                    
                    {/* Animated Particle */}
                    <circle className="animate-pulse">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={`M ${sourceNode.x} ${sourceNode.y} 
                              C ${controlPoint1.x} ${controlPoint1.y},
                                ${controlPoint2.x} ${controlPoint2.y},
                                ${targetNode.x} ${targetNode.y}`}
                      >
                        <circle r="3" fill="#4F46E5" />
                      </animateMotion>
                    </circle>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  className="cursor-pointer transition-all duration-300 hover:scale-105"
                  onClick={() => handleNodeClick(node.id)}
                >
                  {/* Node Glow Effect */}
                  <circle
                    r="45"
                    className={`opacity-20 blur-md ${node.color}`}
                    filter="url(#glow)"
                  />

                  {/* Node Background */}
                  <rect
                    x="-80"
                    y="-40"
                    width="160"
                    height="80"
                    rx="16"
                    className={`
                      fill-gray-900/80 backdrop-blur-md
                      stroke-2 ${selectedNode === node.id ? 'stroke-indigo-500' : 'stroke-gray-700'}
                    `}
                    filter="url(#glow)"
                  />

                  {/* Node Content */}
                  <foreignObject x="-75" y="-35" width="150" height="70">
                    <div className="h-full flex flex-col justify-center items-center p-2 space-y-1">
                      <h3 className="text-sm font-medium text-white truncate w-full text-center">
                        {node.title}
                      </h3>
                      {node.tags && node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {node.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full
                                bg-indigo-500/20 text-indigo-300
                                border border-indigo-500/20"
                            >
                              {tag}
                            </span>
                          ))}
                          {node.tags.length > 2 && (
                            <span className="text-[10px] text-indigo-400">
                              +{node.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </foreignObject>

                  {/* Action Buttons */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <circle
                      cx="70"
                      cy="-30"
                      r="16"
                      className="fill-indigo-500 hover:fill-indigo-600 cursor-pointer
                        filter drop-shadow-lg transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNoteSelect(node.id);
                      }}
                    />
                    <Edit
                      size={16}
                      className="text-white transform translate-x-[62px] -translate-y-[38px]
                        pointer-events-none"
                    />
                  </g>
                </g>
              ))}
            </g>
          </svg>
        )}

        {/* Floating Action Button */}
        <button
          onClick={onCreateNote}
          className="absolute bottom-6 right-6 p-4 rounded-full
            bg-gradient-to-r from-indigo-500 to-purple-500
            text-white shadow-lg hover:shadow-xl
            transform hover:scale-105 transition-all duration-300
            hover:from-indigo-600 hover:to-purple-600
            border border-indigo-400/20"
        >
          <Plus size={24} className="drop-shadow-lg" />
        </button>
      </div>
    </div>
  );
};

export default MindMap; 