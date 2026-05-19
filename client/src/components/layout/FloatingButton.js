export default function FloatingButton(props) {
    const { icon, onClick, text } = props
    return (
        <div className='fixed bottom-10 right-10 z-50 rounded-md bg-[#5958b2] px-4 py-4 text-lg font-semibold text-white cursor-pointer' onClick={onClick}>
            {icon && <span className='mr-2'>{icon}</span>}
            {text}
        </div>
    )
}
