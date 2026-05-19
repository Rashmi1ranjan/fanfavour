import { getCloudFrontAssetsUrl } from '../../lib/assets'
import Image from 'next/image'
import { CreditCard } from 'lucide-react'

export default function PaymentCardInfo(props) {

    const setCardToPrimary = (card_id) => {
        props.onPrimary(card_id)
    }

    const removeCard = (card_id) => {
        props.onRemove(card_id)
    }

    return (
        <div className="border border-[#aaa] rounded-sm">
            <div className="px-[25px] py-[18px] flex items-center cursor-pointer">
                {/* visa, mastercard, discover, jcb */}
                <div className="w-[50px] mr-[30px]">
                    {props.card_type ? (
                        <Image
                            src={getCloudFrontAssetsUrl(
                                `payment-icon/${props.card_type === 'master' ? 'mastercard' : props.card_type}.png`
                            )}
                            alt={props.card_type}
                            width={50}
                            height={50}
                            priority={false}
                            className='object-contain'
                            draggable={false}
                        />
                    ) : (
                        <CreditCard className='text-[35px]' />
                    )}
                </div>
                <div className="text-[18px]">
                    <p>{props.card_type === undefined ? '' : props.card_type.toUpperCase()} **** {props.card_number}</p>
                    <small className="text-[70%]">Expires {props.expiry_date}</small>
                </div>
            </div>
            {
                props.allow_edit === true &&
                <div className="px-[25px] py-[10px] border-t border-[#aaa] flex justify-between">
                    <div>
                        {
                            props.is_primary === true ?
                                'Primary' :
                                <button
                                    className='btn-link m-0 p-0 cursor-pointer'
                                    onClick={() => setCardToPrimary(props.card_id)}
                                    style={{ border: 'none', textDecoration: 'none' }}
                                    disabled={props.processing}
                                >
                                    MAKE PRIMARY
                                </button>
                        }
                    </div>
                    <div>
                        {
                            props.is_primary === false && <button
                                className='btn-link m-0 p-0 cursor-pointer'
                                onClick={() => removeCard(props.card_id)}
                                style={{ border: 'none', textDecoration: 'none' }}
                                disabled={props.processing}>
                                REMOVE
                            </button>
                        }
                    </div>
                </div>
            }

        </div>
    )
}
