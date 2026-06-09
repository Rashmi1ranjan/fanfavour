import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { Chart } from 'react-google-charts'

interface Props {
    rootStore: RootStore
}

const Loader = () => {
    return <div className='text-center mt-5'>
        <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
            <span className='sr-only'>Loading...</span>
        </div>
    </div>
}

const Health: React.FC<Props> = ({ rootStore }) => {

    const { VideoProcessingStore, authStore } = rootStore
    const { getHealth, data, loading, error } = VideoProcessingStore
    const { theme, bgColor, fontColor } = authStore

    const chartOptions = {
        hAxis: {
            title: 'Date',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        vAxis: {
            title: 'Count',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        legend: {
            position: 'top',
            alignment: 'center',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        colors: ['#65BC16', '#E86F56'],
        pointSize: 4,
        backgroundColor: bgColor,
        titleTextStyle: {
            color: fontColor
        }
    }

    useEffect(() => {
        getHealth()
    }, [])

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='d-flex align-items-baseline justify-content-between'>
                <h4 className='card-title'>Video Processing Health</h4>
            </div>
            {loading.health ?
                <Loader /> :
                error.health ?
                    <div className='responsive alert alert-danger p-3 my-3 rounded'>
                        {error.health}
                    </div>
                    :
                    <Chart
                        width='100%'
                        height='400px'
                        chartType='LineChart'
                        data={data.health}
                        loader={<Loader />}
                        options={chartOptions}
                        legendToggle
                    />
            }
        </Container>
    )
}

export default observer(Health)
