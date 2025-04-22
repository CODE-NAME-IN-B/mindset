import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  email: string | null;
  display_name: string | null;
  bio: string | null;
  created_at: string;
}

const TestSupabase: React.FC = () => {
  useEffect(() => {
    ensureUserProfile();
  }, []);

  const attemptProfileCreation = async (user: any) => {
    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking for existing profile:", profileError);
        return;
      }

      if (existingProfile) {
        return;
      }

      const { error: insertError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          username: user.email?.split('@')[0] || `user_${Math.floor(Math.random() * 1000000)}`,
          avatar_url: null,
          email: user.email,
          display_name: null,
          bio: null,
        },
      ]);

      if (insertError) {
        if (insertError.code === '42P01') {
          console.error("Profiles table does not exist:", insertError);
        } else if (insertError.code === '23505') {
          console.error("Username already exists:", insertError);
        } else {
          console.error("Error creating profile:", insertError);
        }
      }
    } catch (error) {
      console.error("Unexpected error creating profile:", error);
    }
  };
  
  const ensureUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
          await attemptProfileCreation(user);
        } else if (error) {
          if (error.code === '42P01') {
            console.error("Profiles table does not exist");
          } else {
            console.error("Error fetching profile:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  };
  
  // Component silently handles profile initialization in the background
  return null;
};

export default TestSupabase;