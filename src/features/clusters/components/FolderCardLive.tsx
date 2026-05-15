'use client';

import { useEffect, useState } from 'react';
import type { Cluster } from '../../../types/cluster';
import { fetchClusterPhotos } from '../api';
import { clusterToVM, type FolderCardVM } from '../lib';
import { FolderCard } from '../../../components/ui';

interface Props {
  cluster: Cluster;
  onClick?: () => void;
}

// 클러스터 1건을 받아 사진 fetch + VM 변환 후 FolderCard 렌더.
export function FolderCardLive({ cluster, onClick }: Props) {
  const [vm, setVm] = useState<FolderCardVM | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchClusterPhotos(cluster.id, cluster.roomId).then((photos) => {
      if (cancelled) return;
      setVm(clusterToVM(cluster, photos));
    });
    return () => {
      cancelled = true;
    };
  }, [cluster.id, cluster.roomId]);

  if (!vm) {
    return <FolderCard icon="…" title={cluster.title} count={0} kw={[]} onClick={onClick} />;
  }
  return (
    <FolderCard
      icon={vm.icon}
      title={vm.title}
      count={vm.count}
      kw={vm.keywords}
      thumbnails={vm.thumbnails}
      onClick={onClick}
    />
  );
}
