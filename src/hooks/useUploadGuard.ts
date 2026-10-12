import { useEffect } from 'react';
import { useUpload } from '../context/UploadContext';

export interface UseUploadGuardOptions {
  id: string;
  source: 'gallery' | 'event' | 'camera' | 'folder';
  title: string;
  details?: string;
  count?: number;
  progress?: number;
  isActive: boolean;
}

/**
 * Custom hook to register any upload, camera stream, or folder sync session
 * with the global UploadGuard.
 * 
 * When isActive is true:
 * - Registers the task in the global upload registry.
 * - Activates window.onbeforeunload protection.
 * - Intercepts F5, Ctrl+R, Cmd+R to present the UploadReloadWarningModal.
 * 
 * Automatically unregisters when isActive is false or when component unmounts.
 */
export function useUploadGuard({
  id,
  source,
  title,
  details,
  count,
  progress,
  isActive,
}: UseUploadGuardOptions) {
  const { registerUploadTask, unregisterUploadTask } = useUpload();

  useEffect(() => {
    if (!isActive) {
      unregisterUploadTask(id);
      return;
    }

    registerUploadTask({
      id,
      source,
      title,
      details,
      count,
      progress,
    });

    return () => {
      unregisterUploadTask(id);
    };
  }, [id, source, title, details, count, progress, isActive, registerUploadTask, unregisterUploadTask]);
}
