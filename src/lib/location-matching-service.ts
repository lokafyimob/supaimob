import { prisma } from '@/lib/prisma'

interface LocationData {
  lat: number
  lng: number
  address: string
  radius: number
}

interface PropertyLocation {
  lat?: number
  lng?: number
  address?: string
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Extract coordinates from property address using geocoding
 * This would normally use Google Geocoding API, but for now we'll simulate
 */
async function getPropertyCoordinates(property: any): Promise<PropertyLocation | null> {
  // In a real implementation, you would use Google Geocoding API here
  // For now, we'll return mock coordinates for demonstration
  
  if (!property.address) return null
  
  // Mock coordinates for Brazilian cities (you should replace with actual geocoding)
  const mockCoordinates: { [key: string]: { lat: number, lng: number } } = {
    'são paulo': { lat: -23.5505, lng: -46.6333 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
    'belo horizonte': { lat: -19.9167, lng: -43.9345 },
    'brasília': { lat: -15.7942, lng: -47.8822 },
    'salvador': { lat: -12.9714, lng: -38.5124 },
    'fortaleza': { lat: -3.7319, lng: -38.5267 },
    'curitiba': { lat: -25.4284, lng: -49.2733 },
    'recife': { lat: -8.0476, lng: -34.8770 },
    'porto alegre': { lat: -30.0346, lng: -51.2177 }
  }
  
  const addressLower = property.address.toLowerCase()
  
  for (const [city, coords] of Object.entries(mockCoordinates)) {
    if (addressLower.includes(city)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        address: property.address
      }
    }
  }
  
  return null
}

/**
 * Find leads that should be notified about a new property based on location
 */
export async function findLeadsForLocationNotification(propertyId: string, userId: string) {
  try {
    // Get the property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        user: true,
        company: true
      }
    })

    if (!property) {
      console.log('Property not found')
      return
    }

    // Get property coordinates
    const propertyLocation = await getPropertyCoordinates(property)
    if (!propertyLocation || !propertyLocation.lat || !propertyLocation.lng) {
      console.log('Could not get property coordinates')
      return
    }

    console.log(`Checking location matches for property ${propertyId} at ${propertyLocation.lat}, ${propertyLocation.lng}`)

    // Find all leads with location preferences
    const leadsWithLocation = await prisma.lead.findMany({
      where: {
        preferredLocation: {
          not: null
        },
        status: 'ACTIVE',
        // Don't notify the same user who created the property
        userId: {
          not: userId
        }
      },
      include: {
        user: true
      }
    })

    console.log(`Found ${leadsWithLocation.length} leads with location preferences`)

    const notifications = []

    for (const lead of leadsWithLocation) {
      try {
        // Parse lead's preferred location
        const leadLocation: LocationData = JSON.parse(lead.preferredLocation!)
        
        // Calculate distance between property and lead's preferred location
        const distance = calculateDistance(
          propertyLocation.lat,
          propertyLocation.lng,
          leadLocation.lat,
          leadLocation.lng
        )

        console.log(`Distance for lead ${lead.id}: ${distance}km (radius: ${leadLocation.radius}km)`)

        // Check if property is within the lead's preferred radius
        if (distance <= leadLocation.radius) {
          // Additional matching criteria
          const isCompatible = checkPropertyLeadCompatibility(property, lead)
          
          if (isCompatible) {
            // Create notification
            await prisma.leadNotification.create({
              data: {
                leadId: lead.id,
                propertyId: property.id,
                type: 'LOCATION_MATCH',
                message: `Novo imóvel encontrado em ${propertyLocation.address} - ${distance.toFixed(1)}km da sua localização preferida`,
                isRead: false
              }
            })

            notifications.push({
              leadId: lead.id,
              leadName: lead.name,
              leadPhone: lead.phone,
              propertyTitle: property.title,
              distance: distance.toFixed(1),
              userEmail: lead.user.email
            })

            console.log(`Created location notification for lead ${lead.id}`)
          }
        }
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error)
      }
    }

    console.log(`Created ${notifications.length} location-based notifications`)
    return notifications

  } catch (error) {
    console.error('Error in findLeadsForLocationNotification:', error)
    return []
  }
}

/**
 * Check if property and lead are compatible based on basic criteria
 */
function checkPropertyLeadCompatibility(property: any, lead: any): boolean {
  // Check property type
  if (lead.propertyType && property.type !== lead.propertyType) {
    return false
  }

  // Check interest (rent vs buy)
  const propertyAvailability = property.isForRent ? 'RENT' : 'BUY'
  if (lead.interest !== propertyAvailability) {
    return false
  }

  // Check price range
  if (lead.maxPrice && property.price > lead.maxPrice) {
    return false
  }

  if (lead.minPrice && property.price < lead.minPrice) {
    return false
  }

  // Check bedrooms
  if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) {
    return false
  }

  if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) {
    return false
  }

  // Check bathrooms
  if (lead.minBathrooms && property.bathrooms < lead.minBathrooms) {
    return false
  }

  if (lead.maxBathrooms && property.bathrooms > lead.maxBathrooms) {
    return false
  }

  // Check area
  if (lead.minArea && property.area < lead.minArea) {
    return false
  }

  if (lead.maxArea && property.area > lead.maxArea) {
    return false
  }

  return true
}

/**
 * Get location-based notifications for a user's leads
 */
export async function getLocationNotifications(userId: string) {
  try {
    const notifications = await prisma.leadNotification.findMany({
      where: {
        lead: {
          userId: userId
        },
        type: 'LOCATION_MATCH',
        isRead: false
      },
      include: {
        lead: true,
        property: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return notifications
  } catch (error) {
    console.error('Error getting location notifications:', error)
    return []
  }
}

/**
 * Mark location notification as read
 */
export async function markLocationNotificationAsRead(notificationId: string) {
  try {
    await prisma.leadNotification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}