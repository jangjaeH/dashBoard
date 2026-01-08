import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation"
export default async function Home() {

  // 토큰 검사
  const cookieStore =  await cookies();
  const token = cookieStore.get('token');
  if(!token) {
    redirect('/login');
  } else {
    redirect('/home');
  }
  
  return (
    <div>Dashboard page</div>
  );
}
