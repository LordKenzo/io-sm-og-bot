interface Participants {
  type: string // 'user' | 'none' | 'team' | 'escalation'
  username?: string
  id?: string
}

export interface SchedulePayload {
  name: Date | string
  startDate: string
  endDate: string
  type: string
  length: number
  participants: Array<Participants>
  timeRestriction?: {
    type: string // 'time-of-day'
    restriction: {
      startHour: number
      startMin: number
      endHour: number
      endMin: number
    }
  }
}

interface Recipient {
  id: string
  name: string
  type: string
}

interface Period {
  startDate: string
  endDate: string
  type: string
  recipient: Recipient
  flattenedRecipients?: Array<Recipient>
}

export interface Rotation {
  id: string
  name: string
  order: number
  periods: Array<Period>
}

export interface Rotations {
  rotations?: Array<Rotation>
}

interface Timeline {
  startDate: string
  endDate: string
  finalTimeline: Rotations
  baseTimeline: Rotations
  requestId: string
  expandable: Array<string>
  took: number
}

export interface TimelineResponse {
  data: Timeline
}

export interface ScheduleResponse {
  data: {
    data: {
      id: string
      name: string
      enabled: boolean
    }
    took: number
    requestId: string
  }
  status: number
}

export interface DeleteResponse {
  data: {
    result: string
    took: number
    requestId: string
  }
  status: number
}
