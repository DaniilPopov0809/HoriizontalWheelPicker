'use client'

import { HorizontalTimePicker } from '@/components/horizontal-time-picker'
import { useState } from 'react'

export default function WheelPickerDemo() {
  const [selectedTimeHorizontal, setSelectedTimeHorizontal] = useState(10)

  const handleHorizontalTimeChange = (value: number) => {
    setSelectedTimeHorizontal(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 mb-8">
          <HorizontalTimePicker 
            onValueChange={handleHorizontalTimeChange}
            defaultValue={selectedTimeHorizontal}
            className="w-full"
          />      
        </div>

      </div>
    </div>
  )
}