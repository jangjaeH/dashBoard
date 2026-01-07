import { cookies } from "next/headers"; 
import { redirect } from "next/navigation";
  
export default async function Home() {
    // 토큰 검사
    const cookieStore = await cookies();
    const token = cookieStore.get('autoh_token');
    if(!token) {
        redirect('/login');
    }
    return (
        <div>home</div>
    )
}