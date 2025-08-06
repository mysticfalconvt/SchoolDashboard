import ViewStudentPage from './ViewStudentPage';

interface Child {
  id: string;
  name: string;
}

interface Parent {
  children: Child[];
}

interface ViewParentPageProps {
  parent: Parent;
}

export default function ViewParentPage({ parent }: ViewParentPageProps) {
  return (
    <div>
      <h2 style={{ textAlign: 'center', textDecoration: 'underline' }}>
        Parent info
      </h2>
      {parent.children.map((child) => (
        <div key={child.id}>
          <ViewStudentPage student={child} />
        </div>
      ))}
    </div>
  );
}
