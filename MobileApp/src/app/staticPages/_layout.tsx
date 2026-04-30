import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StaticPageLayout() {
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
        }}
      />
    </Stack>
  );
}
