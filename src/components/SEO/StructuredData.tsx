/**
 * StructuredData Component
 * Injects JSON-LD structured data into the page head
 */

import { validateSchema } from '../../lib/seo/structuredData';

interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function StructuredData({ data }: StructuredDataProps) {
  // Handle both single schema and array of schemas
  const schemas = Array.isArray(data) ? data : [data];
  
  // Validate schemas before injection
  const validSchemas = schemas.filter(schema => {
    const isValid = validateSchema(schema);
    if (!isValid && import.meta.env.DEV) {
      console.warn('Invalid schema detected:', schema);
    }
    return isValid;
  });
  
  if (validSchemas.length === 0) {
    return null;
  }
  
  return (
    <>
      {validSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
