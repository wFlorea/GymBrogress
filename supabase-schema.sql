-- GymBrogress Supabase Database Schema

-- 1. Create weekly_plans table
CREATE TABLE weekly_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    day_of_week INT NOT NULL, -- 0-6 (0 = Monday, 6 = Sunday)
    workout_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for weekly_plans
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weekly plans" ON weekly_plans
    FOR ALL USING (auth.uid() = user_id);

-- 2. Create workout_logs table
CREATE TABLE workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    workout_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for workout_logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workout logs" ON workout_logs
    FOR ALL USING (auth.uid() = user_id);

-- 3. Create workout_sets table
CREATE TABLE workout_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    set_number INT NOT NULL,
    target_reps INT,
    target_weight DECIMAL,
    actual_reps INT,
    actual_weight DECIMAL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for workout_sets (via workout_logs)
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workout sets" ON workout_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workout_logs 
            WHERE workout_logs.id = workout_sets.workout_log_id 
            AND workout_logs.user_id = auth.uid()
        )
    );
