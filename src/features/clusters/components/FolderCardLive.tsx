'use client';

import { useEffect, useState } from 'react';
import type { Cluster } from '../../../types/cluster';
import { fetchClusterPhotos } from '../api';
import { clusterToVM, type FolderCardVM } from '../lib';
import { FolderCard } from '../../../components/ui';

interface Props {
  cluster: Cluster;
  // ClusterPhoto에 aiKeywords가 없으므로, 키워드 계산을 위해 외부에서 PhotoIndex를 넘김.
  photoKeywordIndex?: Record<string, string[]>;
  onClick?: () => void;
}

// 클러스터 1건을 받아 사진 fetch + VM 변환 후 FolderCard 렌더.
export function FolderCardLive({ cluster, photoKeywordIndex, onClick }: Props) {
  const [vm, setVm] = useState<FolderCardVM | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchClusterPhotos(cluster.id, cluster.roomId).then((photos) => {
      if (cancelled) return;
      const withKw = photos.map((p) => ({ ...p, aiKeywords: photoKeywordIndex?.[p.id] }));
      setVm(clusterToVM(cluster, withKw));
    });
    return () => {
      cancelled = true;
    };
  }, [cluster.id, cluster.roomId, photoKeywordIndex]);

  if (!vm) {
    return <FolderCard icon="…" title={cluster.title} count={0} kw={[]} />;
  }
  return (
    <FolderCard
      icon={vm.icon}
      title={vm.title}
      count={vm.count}
      kw={vm.keywords}
      onClick={onClick}
    />
  );
}
