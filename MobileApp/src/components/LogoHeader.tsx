import { View, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome } from "@expo/vector-icons";

export default function LogoHeader() {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            {/* Logo with link to home */}
            <Link href="/" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable>
                    <Image
                    source={require('@assets/logo.png')}
                    style={{ height: 40, width: 225, resizeMode: 'contain' }}
                    />
                </Pressable>
            </Link>
            
            {/* social media */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Link href="https://www.facebook.com/collinsvilledailynews" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable>
                    <FontAwesome name="facebook-square" size={30} color="#5f249f" style={{ marginHorizontal: 10 }} />
                    </Pressable>
                </Link>
            <Link href="https://x.com/CDNOfficialNews" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable>
                <FontAwesome name="twitter" size={30} color="#5f249f" style={{ marginHorizontal: 10 }} />
                </Pressable>
            </Link>
            <Link href="https://www.instagram.com/collinsvilledailynews/" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable>
                <FontAwesome name="instagram" size={30} color="#5f249f" style={{ marginHorizontal: 10 }} />
                </Pressable>
            </Link>
            </View>
       </View>
     );
}