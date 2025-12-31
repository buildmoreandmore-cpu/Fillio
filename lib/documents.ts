import { supabase, isSupabaseConfigured } from './supabase';
import type { Document } from './database.types';
import type { PFSData, DocumentType } from '../types';

export interface CreateDocumentInput {
  title: string;
  type: DocumentType;
  data: PFSData;
}

export interface UpdateDocumentInput {
  title?: string;
  status?: 'DRAFT' | 'COMPLETE';
  data?: PFSData;
  pdf_url?: string;
}

// Get all documents for the current user
export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data || [];
};

// Get a single document
export const getDocument = async (documentId: string): Promise<Document | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    return null;
  }

  return data;
};

// Create a new document
export const createDocument = async (
  userId: string,
  input: CreateDocumentInput
): Promise<Document | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title: input.title,
      type: input.type,
      status: 'DRAFT',
      data: input.data as any
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    return null;
  }

  return data;
};

// Update a document
export const updateDocument = async (
  documentId: string,
  input: UpdateDocumentInput
): Promise<Document | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('documents')
    .update({
      ...input,
      data: input.data as any,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating document:', error);
    return null;
  }

  return data;
};

// Delete a document
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }

  return true;
};

// Save document to storage (for PDF)
export const uploadPDF = async (
  userId: string,
  documentId: string,
  pdfBlob: Blob
): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;

  const fileName = `${userId}/${documentId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    console.error('Error uploading PDF:', uploadError);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  // Update document with PDF URL
  await updateDocument(documentId, { pdf_url: publicUrl });

  return publicUrl;
};
