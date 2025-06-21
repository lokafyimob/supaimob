import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { getLocationNotifications, markLocationNotificationAsRead } from '@/lib/location-matching-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const notifications = await getLocationNotifications(user.id)
    
    return NextResponse.json({
      notifications,
      count: notifications.length
    })
  } catch (error) {
    console.error('Error fetching location notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { notificationId } = await request.json()
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }
    
    await markLocationNotificationAsRead(notificationId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}