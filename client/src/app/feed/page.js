import ChatLayout from "@/components/layout/ChatLayout"

export default function Feed() {
    const tabs = ['Home', 'Search', 'Message']
    return (
        <ChatLayout tabs={tabs} requestFrom='feed' />
    )
}