'use client'

import { withPrivateRoute } from '../../components/layout/PrivateRoute'
import { ALLOW_ALL } from '@/lib/constant'
import AddNewCard from './AddNewCard'

function Subscription() {

    return (
        <div>
            {/* NAME — OUTSIDE OF CARD */}
            <AddNewCard addCardAndSubscription={true} />
        </div>
    )
}

export default withPrivateRoute(Subscription, ALLOW_ALL)
