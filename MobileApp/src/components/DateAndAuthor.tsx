import { formatDistanceToNow } from "date-fns";
import { Text, View } from "react-native";

type DateAndAuthorProps = {
  publishedDate?: string;
  author?: string;
}

export default function DateAndAuthor({ publishedDate, author }: DateAndAuthorProps) {
  let formattedDate = '';
  
  try {
    if (publishedDate) {
      // if formatDistanceToNow gives less than 24 hours ago use that as formattedDate, else show date in MMM dd, yyyy format
      const distance = formatDistanceToNow(new Date(publishedDate), { addSuffix: true });
      // If less than 1 hour ago use minutes
      const minutesAgoMatch = distance.match(/(\d+)\s+minutes?\s+ago/);
      if (minutesAgoMatch) {
        formattedDate = distance;
      }
      
      const hoursAgoMatch = distance.match(/(\d+)\s+hours?\s+ago/);
      if (hoursAgoMatch) {
        formattedDate = distance.replace(/^about\s+/, '');
      } else {
        formattedDate = new Date(publishedDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    formattedDate = 'Recently';
  }

  const authorName = author || '';

  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      <Text style={{ color: 'grey' }}>{formattedDate}</Text>
      {authorName ? (
        <>
          <Text style={{ color: 'grey' }}>&#x2022;</Text>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: 'grey' }}>{authorName}</Text>
          </View>
          
        </>
      ) : null}
      {/* <MaterialCommunityIcons name="dots-horizontal" size={22} color="grey" style={{ marginLeft: 'auto' }} /> */}
    </View>
  )
}