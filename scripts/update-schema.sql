-- Update owners table to make companyId nullable
ALTER TABLE owners ALTER COLUMN "companyId" DROP NOT NULL;

-- Add any missing columns that might be needed
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "amenities" TEXT DEFAULT '[]';

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'owners' AND column_name = 'companyId';

SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name IN ('images', 'amenities');