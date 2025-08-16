-- Create storage bucket for creature images
INSERT INTO storage.buckets (id, name, public) VALUES ('creature-images', 'creature-images', true);

-- Create storage policies for creature images
CREATE POLICY "Anyone can view creature images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'creature-images');

CREATE POLICY "Users can upload their own creature images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'creature-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own creature images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'creature-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own creature images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'creature-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);