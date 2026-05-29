import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, SafeAreaView
} from 'react-native';

const API_STREAM='ht...52/app-api/chat/stream';
const TIMEOUT=12...OTTLE=50;

const C={bg:'#08090a',card:'#111318',border:'#1e2430',text:'#e4e5e7',sub:'#6b7280',accent:'#5e6ad2',accentLight:'#7c82e0',userBubble:'#5e6ad2',botBubble:'#1a1d26',inputBg:'#111318',danger:'#ef4444'};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const flatListRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.abort(); streamRef.current = null; }
    setLoading(false);
  };

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    const botId = (Date.now() + 1).toString();
    // 优化：先显示"思考中"气泡，再替换为真实内容
    setMessages(prev => [...prev, userMsg, { id: botId, role: 'hermes', text: '思考中...', isThinking: true }]);
    setInput('');
    setLoading(true);

    const xhr = new XMLHttpRequest();
    streamRef.current = xhr;

    let buffer = '', fullText = '', lastIndex = 0, lastUpdate = 0;
    let firstChunkReceived = false;

    xhr.open('POST', API_STREAM);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = TIMEOUT;

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer += newText;

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        for (const line of event.split('\n')) {
          const s = line.trim();
          if (s.startsWith('data: ')) {
            const d = s.substring(6);
            if (d === '[DONE]') { setLoading(false); return; }
            try {
              const p = JSON.parse(d);
              if (p.text) {
                if (!firstChunkReceived) {
                  firstChunkReceived = true;
                  fullText = p.text; // 第一个chunk替换"思考中"
                } else {
                  fullText += p.text;
                }
                const now = Date.now();
                if (now - lastUpdate > THROTTLE) {
                  lastUpdate = now;
                  setMessages(prev => prev.map(m =>
                    m.id === botId ? { ...m, text: fullText, isThinking: false } : m
                  ));
                }
              }
              if (p.sid) setSessionId(p.sid);
              if (p.done) {
                if (fullText) setMessages(prev => prev.map(m =>
                  m.id === botId ? { ...m, text: fullText, isThinking: false } : m
                ));
                setLoading(false);
              }
            } catch (e) {}
          }
        }
      }
    };

    xhr.onerror = () => {
      setMessages(prev => prev.map(m =>
        m.id === botId && m.isThinking ? { ...m, text: '网络错误 😢', isThinking: false } : m
      ));
      setLoading(false);
    };
    xhr.ontimeout = () => {
      setMessages(prev => prev.map(m =>
        m.id === botId ? { ...m, text: fullText || '请求超时 ⏰', isThinking: false } : m
      ));
      setLoading(false);
    };
    xhr.onloadend = () => { setLoading(false); };

    xhr.send(JSON.stringify({ message: text, session_id: sessionId }));
  }, [input, loading, sessionId]);

  useEffect(() => { return () => { if (streamRef.current) streamRef.current.abort(); }; }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  const renderMessage = useCallback(({ item }) => (
    <View style={[styles.msgRow, item.role==='user'?styles.msgUser:styles.msgHermes]}>
      <View style={[styles.bubble, item.role==='user'?styles.bubbleUser:styles.bubbleHermes]}>
        {item.isThinking ? (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" color={C.sub} />
            <Text style={styles.thinkingText}>{item.text}</Text>
          </View>
        ) : (
          <Text style={[styles.bubbleText, item.role==='user'?styles.bubbleTextUser:styles.bubbleTextHermes]}>
            {item.text}
          </Text>
        )}
      </View>
    </View>
  ), []);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.headerTitle}>Hermes</Text>
        <Text style={styles.headerSub}>AI 助手</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToEnd}
        onLayout={scrollToEnd}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⚕️</Text>
            <Text style={styles.emptyTitle}>Hermes</Text>
            <Text style={styles.emptySub}>有什么可以帮你？</Text>
          </View>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'}>
        <View style={styles.inputBar}>
          <TextInput style={styles.input} value={input} onChangeText={setInput}
            placeholder="发消息..." placeholderTextColor={C.sub}
            multiline maxLength={2000} onSubmitEditing={sendMessage}
            returnKeyType="send" blurOnSubmit={false} />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim()&&!loading)&&styles.sendBtnDisabled]}
            onPress={loading?stopStream:sendMessage}
            disabled={!input.trim()&&!loading}>
            {loading ? <Text style={styles.stopBtn}>■</Text> : <Text style={styles.sendBtnText}>↑</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border},
  headerDot:{width:10,height:10,borderRadius:5,backgroundColor:'#22c55e',marginRight:10},
  headerTitle:{color:C.text,fontSize:18,fontWeight:'700'},
  headerSub:{color:C.sub,fontSize:13,marginLeft:8},
  list:{flex:1},
  listContent:{padding:16,paddingBottom:8},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:120},
  emptyIcon:{fontSize:48,marginBottom:12},
  emptyTitle:{color:C.text,fontSize:24,fontWeight:'700',marginBottom:4},
  emptySub:{color:C.sub,fontSize:15},
  msgRow:{marginBottom:12,flexDirection:'row'},
  msgUser:{justifyContent:'flex-end'},
  msgHermes:{justifyContent:'flex-start'},
  bubble:{maxWidth:'80%',borderRadius:18,paddingHorizontal:16,paddingVertical:10},
  bubbleUser:{backgroundColor:C.userBubble,borderBottomRightRadius:4},
  bubbleHermes:{backgroundColor:C.bubbleHermes,borderBottomLeftRadius:4},
  bubbleText:{fontSize:16,lineHeight:22},
  bubbleTextUser:{color:'#fff'},
  bubbleTextHermes:{color:C.text},
  thinking:{flexDirection:'row',alignItems:'center'},
  thinkingText:{color:C.sub,fontSize:14,marginLeft:6},
  inputBar:{flexDirection:'row',alignItems:'flex-end',padding:12,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.bg},
  input:{flex:1,backgroundColor:C.inputBg,borderRadius:22,paddingHorizontal:18,paddingVertical:10,color:C.text,fontSize:16,maxHeight:120,borderWidth:1,borderColor:C.border},
  sendBtn:{width:42,height:42,borderRadius:21,backgroundColor:C.accent,alignItems:'center',justifyContent:'center',marginLeft:8},
  sendBtnDisabled:{backgroundColor:C.border},
  sendBtnText:{color:'#fff',fontSize:20,fontWeight:'700'},
  stopBtn:{color:'#fff',fontSize:16,fontWeight:'700'},
});
