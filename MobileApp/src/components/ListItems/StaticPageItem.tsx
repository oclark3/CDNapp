import { View, Text } from 'react-native';

export default function StaticPageItem({ title }: { title: string }) {
    return (
        <View style={{ backgroundColor: 'white', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{title}</Text>
        </View>
    )
}