import React from 'react';
import { FlatList, Text, View } from 'react-native';
import type { QueueEntry } from '../model/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { useQueueViewModel } from '../viewmodels/useQueueViewModel';

export function QueueTab() {
  const { queue, isLoading, isError, refetch } = useQueueViewModel();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (queue.length === 0) return <EmptyState message="No active queue entries." />;

  return (
    <FlatList
      data={queue}
      keyExtractor={(entry: QueueEntry) => entry.queue_id}
      renderItem={({ item }: { item: QueueEntry }) => (
        <View>
          <Text>Your Token</Text>
          <Text>{item.token_number}</Text>
          <Text>{item.queue_status}</Text>
          <Text>Doctor: {item.doctor_id}</Text>
          <Text>Hospital: {item.hospital_id}</Text>
          {item.estimated_wait_time !== undefined ? (
            <Text>Estimated wait: {item.estimated_wait_time} minutes</Text>
          ) : null}
        </View>
      )}
    />
  );
}
