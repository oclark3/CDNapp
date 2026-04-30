// Footer for the bottom of each page with copyright, terms, privacy, etc.
import { Link } from "expo-router";
import { Text, View, Image, Pressable } from "react-native";
import { FontAwesome } from '@expo/vector-icons';   

export default function MainFooter() {
    return (
        <View style={{padding: 15, alignItems: 'center', backgroundColor: 'white', marginTop: 70}}>
            {/* Logo */}
            <Image
                source={require('@assets/logo.png')}
                style={{ height: 35, resizeMode: 'contain', marginBottom: 10 }}
            />
            
            {/* Social Media */}
            <View style={{ width: '45%', flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', marginBottom: 30, marginTop: 10 }}>
                <Link href="https://www.facebook.com/collinsvilledailynews" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable>
                    <FontAwesome name="facebook-square" size={28} color="#5f249f" style={{ marginHorizontal: 10 }} />
                    </Pressable>
                </Link>
                <Link href="https://x.com/CDNOfficialNews" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable>
                    <FontAwesome name="twitter" size={28} color="#5f249f" style={{ marginHorizontal: 10 }} />
                    </Pressable>
                </Link>
                <Link href="https://www.instagram.com/collinsvilledailynews/" asChild style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable>
                    <FontAwesome name="instagram" size={28} color="#5f249f" style={{ marginHorizontal: 10 }} />
                    </Pressable>
                </Link>
            </View>

            {/* Address and Contact Information */}
            
            <Text style={{fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20}}>
                <Text>Phone: </Text>
                    314-952-7525{"\n"}
                <Text>Email: </Text>
                <Link href="mailto:info@collinsvilledailynews.com">info@collinsvilledailynews.com</Link>
            </Text>

            {/* Copyright and Legal */}
            <Text style={{fontSize: 14, color: '#666'}}>
                © Copyright 2026 Collinsville Daily News | PO Box 65, Edwardsville, IL |{' '}
                <Link href="/staticPages/terms">
                    <Text style={{ color: '#666', textDecorationLine: 'underline' }}>Terms of Use</Text>
                </Link>
                {' '}|{' '}
                <Link href="/staticPages/privacy">
                    <Text style={{ color: '#666', textDecorationLine: 'underline' }}>Privacy Policy</Text>
                </Link>
            </Text>
        </View>
    );
}