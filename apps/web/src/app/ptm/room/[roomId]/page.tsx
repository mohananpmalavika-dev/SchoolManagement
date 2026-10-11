import { MeetingRoomWorkspace } from '@/components/MeetingRoomWorkspace';
export default async function Page({params}:{params:Promise<{roomId:string}>}){const {roomId}=await params;return <MeetingRoomWorkspace id={roomId}/>;}
