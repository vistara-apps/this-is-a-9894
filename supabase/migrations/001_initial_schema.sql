-- AdSpark AI Database Schema
-- Initial migration based on PRD specifications

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    connected_social_accounts JSONB DEFAULT '{"instagram": false, "tiktok": false}'::jsonb,
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    product_name TEXT NOT NULL,
    product_image_url TEXT,
    generated_ad_variations JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Variations table
CREATE TABLE public.ad_variations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    generated_copy TEXT,
    ai_performance_score DECIMAL(3,2) DEFAULT 0.0 CHECK (ai_performance_score >= 0 AND ai_performance_score <= 1),
    generation_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Deployments table
CREATE TABLE public.ad_deployments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ad_variation_id UUID REFERENCES public.ad_variations(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
    post_id TEXT,
    deployment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'removed')),
    metrics JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    usage_limits JSONB DEFAULT '{"generations_per_month": 5, "deployments_per_month": 2}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table for analytics and billing
CREATE TABLE public.usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('image_generation', 'ad_deployment', 'api_call')),
    resource_id UUID, -- Can reference projects, ad_variations, etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    cost_credits DECIMAL(10,4) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_ad_variations_project_id ON public.ad_variations(project_id);
CREATE INDEX idx_ad_deployments_ad_variation_id ON public.ad_deployments(ad_variation_id);
CREATE INDEX idx_ad_deployments_platform ON public.ad_deployments(platform);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Ad variations policies
CREATE POLICY "Users can view own ad variations" ON public.ad_variations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = ad_variations.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create ad variations for own projects" ON public.ad_variations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = ad_variations.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Ad deployments policies
CREATE POLICY "Users can view own ad deployments" ON public.ad_deployments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ad_variations av
            JOIN public.projects p ON av.project_id = p.id
            WHERE av.id = ad_deployments.ad_variation_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create ad deployments for own variations" ON public.ad_deployments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ad_variations av
            JOIN public.projects p ON av.project_id = p.id
            WHERE av.id = ad_deployments.ad_variation_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own ad deployments" ON public.ad_deployments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ad_variations av
            JOIN public.projects p ON av.project_id = p.id
            WHERE av.id = ad_deployments.ad_variation_id 
            AND p.user_id = auth.uid()
        )
    );

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_deployments_updated_at BEFORE UPDATE ON public.ad_deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    
    -- Create default free subscription
    INSERT INTO public.subscriptions (user_id, tier, status, usage_limits)
    VALUES (
        NEW.id, 
        'free', 
        'active',
        '{"generations_per_month": 5, "deployments_per_month": 2}'::jsonb
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    user_id_param UUID,
    action_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
    subscription_record RECORD;
BEGIN
    -- Get user's subscription and limits
    SELECT * INTO subscription_record
    FROM public.subscriptions
    WHERE user_id = user_id_param AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check specific action limits
    IF action_param = 'image_generation' THEN
        -- Count generations this month
        SELECT COUNT(*) INTO current_usage
        FROM public.usage_logs
        WHERE user_id = user_id_param
        AND action = 'image_generation'
        AND created_at >= date_trunc('month', NOW());
        
        usage_limit := (subscription_record.usage_limits->>'generations_per_month')::INTEGER;
        
    ELSIF action_param = 'ad_deployment' THEN
        -- Count deployments this month
        SELECT COUNT(*) INTO current_usage
        FROM public.usage_logs
        WHERE user_id = user_id_param
        AND action = 'ad_deployment'
        AND created_at >= date_trunc('month', NOW());
        
        usage_limit := (subscription_record.usage_limits->>'deployments_per_month')::INTEGER;
        
    ELSE
        RETURN FALSE;
    END IF;
    
    RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
