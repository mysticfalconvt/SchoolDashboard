import { useUser } from '../User';
import SignIn from '../loginComponents/SignIn';

interface User {
  id: string;
  name: string;
}

export default function TaTeacherInfo() {
  const user = useUser() as User;
  if (!user) return <SignIn />;
  return (
    <div>
      <h1>{user?.name}'s TA</h1>
    </div>
  );
}
