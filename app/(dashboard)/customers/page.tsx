import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Chat } from '../chat';


export default function CustomersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Friends</CardTitle>
        <CardDescription>View all friends.</CardDescription>
      </CardHeader>
      <CardContent></CardContent>
      <Chat />
    </Card>
  );
}
