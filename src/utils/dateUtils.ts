export const convertTo12Hour = (time24: string): string => {
  try {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error converting time:', error);
    return time24; // Return original if conversion fails
  }
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original if formatting fails
  }
}; 

export const getNextDayDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      date.setDate(date.getDate() + 1); // Increment the day by 1
      return date.toISOString(); // Return the date as an ISO string
    } catch (error) {
      console.error('Error calculating next day date:', error);
      return dateString; // Return original if calculation fails
    }
  };