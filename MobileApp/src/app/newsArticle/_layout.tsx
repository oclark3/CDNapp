import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function NewsArticleLayout() {
  const router = useRouter();
  
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: '',
          headerLeft: () => (
            <Ionicons
              name="chevron-back"
              size={25}
              color="black"
              onPress={() => router.back()}
              style={{ padding: 5 }}
            />
          ),
        //   headerRight: () => (
        //     <View style={{ gap: 10, flexDirection: 'row', alignItems: 'center' }}>
        //       <Ionicons
        //         name="share-outline"
        //         size={20}
        //         color="black"
        //         style={{ backgroundColor: '#EEEEEE', borderRadius: 15, padding: 5 }}
        //       />
        //       <MaterialCommunityIcons
        //         name="dots-horizontal"
        //         size={24}
        //         color="black"
        //         style={{ backgroundColor: '#EEEEEE', borderRadius: 15, padding: 2 }}
        //       />
        //     </View>
        //   )
        }}
      />
    </Stack>
  );
}
