'use client';
import { useParams } from 'next/navigation';
import ServiceForm from '@/components/vendor/ServiceForm';
export default function EditService() {
  const { id } = useParams();
  return <ServiceForm serviceId={id} />;
}
