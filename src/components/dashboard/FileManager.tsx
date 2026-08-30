'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import path from 'path';
import styles from './file-manager.module.scss';

interface FileManagerProps {
  onSelect: (filePath: string) => void;
  onClose: () => void;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

// Extensions d'images prises en charge
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

// Vérifier si un fichier est une image (d'après son extension)
const isImageFile = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
};

// Extraire l'extension pour l'icône
const getFileIcon = (filename: string, isDirectory: boolean): string => {
  if (isDirectory) return '📁';
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return '🖼️';
  return '📄';
};

export default function FileManager({ onSelect, onClose }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/public');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message: string } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ success?: boolean; message: string; filePath?: string; usages?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les fichiers du dossier courant
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Appel API pour lister les fichiers dans le dossier courant
        const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
        const data = await response.json();

        if (data.success) {
          // Filtrer pour ne pas permettre de remonter au-dessus de /public
          const filteredFiles = data.files.filter((file: FileItem) => {
            if (file.isDirectory) {
              // Empêcher de remonter au-dessus de /public
              const fullPath = currentPath === '/public' 
                ? `/public/${file.name}` 
                : `${currentPath}/${file.name}`;
              return fullPath.startsWith('/public');
            }
            return true; // Les fichiers sont toujours autorisés
          });
          setFiles(filteredFiles);
        } else {
          setError(data.error || 'Erreur lors du chargement des fichiers');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
        setError('Impossible de charger les fichiers. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [currentPath]);

  // Sélectionner un fichier
  const handleFileSelect = (file: FileItem) => {
    if (!file.isDirectory) {
      // Retourner le chemin relatif depuis /public avec / au début (ex: "/uploads/image.jpg")
      const relativePath = currentPath === '/public'
        ? `/${file.name}`
        : `/${currentPath.substring('/public/'.length)}/${file.name}`;
      onSelect(relativePath);
      onClose();
    }
  };

  // Naviguer dans un dossier
  const handleDirectoryClick = (dir: FileItem) => {
    if (dir.isDirectory) {
      const newPath = currentPath === '/public'
        ? `/public/${dir.name}`
        : `${currentPath}/${dir.name}`;
      setCurrentPath(newPath);
    }
  };

  // Empêcher de remonter au-dessus de /public
  const canGoUp = currentPath !== '/public';

  // Retour à la racine /public
  const goToRoot = () => {
    setCurrentPath('/public');
  };

  // Gérer l'upload d'un nouveau fichier
  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploadStatus({ success: false, message: 'Upload en cours...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.filePath) {
        setUploadStatus({ success: true, message: 'Fichier uploadé avec succès !' });
        // Sélectionner automatiquement l'image uploadée
        setTimeout(() => {
          onSelect(result.filePath);
          onClose();
        }, 500);
      } else {
        setUploadStatus({ success: false, message: result.error || 'Erreur lors de l\'upload' });
        setTimeout(() => setUploadStatus(null), 3000);
      }
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      setUploadStatus({ success: false, message: 'Impossible de contacter le serveur' });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // Ouvrir le sélecteur de fichiers
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Supprimer un fichier (uniquement pour les images dans /uploads/)
  const handleDeleteFile = async (filePath: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la sélection du fichier
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${fileName}" ? Cette action est irréversible.`)) {
      return;
    }

    setDeleteStatus({ success: false, message: 'Suppression en cours...', filePath });

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setDeleteStatus({ success: true, message: 'Fichier supprimé avec succès !', filePath });
        // Recharger les fichiers pour mettre à jour la liste
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.path !== filePath));
          setDeleteStatus(null);
        }, 500);
      } else {
        // Si le fichier est utilisé, afficher les usages
        if (result.usages && result.usages.length > 0) {
          setDeleteStatus({
            success: false,
            message: 'Ce fichier est utilisé dans le site et ne peut pas être supprimé',
            filePath,
            usages: result.usages,
          });
        } else {
          setDeleteStatus({ success: false, message: result.error || 'Erreur lors de la suppression', filePath });
        }
        setTimeout(() => setDeleteStatus(null), 5000);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setDeleteStatus({ success: false, message: 'Impossible de contacter le serveur', filePath });
      setTimeout(() => setDeleteStatus(null), 3000);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Sélectionner un fichier</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.path}>
          <span>Chemin: <strong>{currentPath}</strong></span>
        </div>

        {/* Bouton pour uploader un nouveau fichier */}
        <div className={styles.uploadArea}>
          <button
            type="button"
            className={styles.uploadButton}
            onClick={triggerFileInput}
          >
            + Uploader une nouvelle image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUpload(file);
              }
              // Réinitialiser l'input pour permettre de sélectionner le même fichier plusieurs fois
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
          {uploadStatus && (
            <div className={`${styles.statusMessage} ${uploadStatus.success ? styles.success : styles.error}`}>
              {uploadStatus.message}
            </div>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Message de statut pour la suppression */}
        {deleteStatus && (
          <div className={`${styles.statusMessage} ${deleteStatus.success ? styles.success : styles.error}`}>
            {deleteStatus.message}
            {!deleteStatus.success && deleteStatus.usages && deleteStatus.usages.length > 0 && (
              <div className={styles.usagesList}>
                <strong>Utilisé dans :</strong>
                <ul>
                  {deleteStatus.usages.map((usage, index) => (
                    <li key={index}>{usage}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>Chargement...</div>
        ) : (
          <div className={styles.fileList}>
            {canGoUp && (
              <div
                className={styles.fileItem}
                onClick={goToRoot}
              >
                <span className={styles.directory}>📁 Retour à /public</span>
              </div>
            )}

            {files.length === 0 ? (
              <div className={styles.empty}>Aucun fichier trouvé dans ce dossier.</div>
            ) : (
              files.map((file) => {
                // Nettoyer le chemin pour enlever /public si présent
                const imageSrc = file.path.startsWith('/public')
                  ? file.path.substring('/public'.length)
                  : file.path;
                
                return (
                  <div
                    key={`${currentPath}/${file.name}`}
                    className={styles.fileItem}
                    onClick={() => file.isDirectory ? handleDirectoryClick(file) : handleFileSelect(file)}
                  >
                    {file.isDirectory ? (
                      <div className={styles.filePreview}>
                        <span className={styles.fileIcon}>📁</span>
                        <span className={styles.fileName}>{file.name}/</span>
                      </div>
                    ) : isImageFile(file.name) ? (
                      <div className={styles.filePreview}>
                        <div className={styles.imagePreview}>
                          <Image
                            src={imageSrc}
                            alt={file.name}
                            width={40}
                            height={40}
                            className={styles.imageThumbnail}
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className={styles.fileName}>{file.name}</span>
                        {/* Bouton Supprimer (uniquement pour les fichiers dans /uploads/) */}
                        {file.path.startsWith('/uploads/') && (
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={(e) => handleDeleteFile(file.path, file.name, e)}
                            title="Supprimer cette image"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={styles.filePreview}>
                        <span className={styles.fileIcon}>{getFileIcon(file.name, false)}</span>
                        <span className={styles.fileName}>{file.name}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
