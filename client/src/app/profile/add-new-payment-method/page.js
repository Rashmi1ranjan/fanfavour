'use client'
import AddNewCard from "../../subscription/AddNewCard";
import AccountPageLayout from "@/components/layout/AccountPageLayout";
import CardRowProfile from "@/components/layout/CardRowProfile";

export default function AddNewPaymentMethod() {
    return (
        <AccountPageLayout>
            <CardRowProfile title='Add New Card' cardBodyClassName='p-0'>
                <AddNewCard addCardAndSubscription={false} />
            </CardRowProfile>
        </AccountPageLayout>
    )
}
