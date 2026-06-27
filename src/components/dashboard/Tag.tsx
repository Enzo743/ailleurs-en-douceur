'use client';

interface TagProps {
  name: string;
  className?: string;
}

export default function Tag({ name, className = '' }: TagProps) {
  return (
    <span className={`dashboard-tag ${className}`}>
      {name}
    </span>
  );
}