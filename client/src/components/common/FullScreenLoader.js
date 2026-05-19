import Loader from './Loader'
import { cn } from '../../lib/utils'

export default function FullScreenLoader({ bgColor = '' }) {
    return <div className={cn('fixed inset-0 z-[100] flex items-center justify-center', bgColor || 'bg-[#fff]/20')}>
        <Loader isLoading={true} size={10} color='black' />
    </div>
}
