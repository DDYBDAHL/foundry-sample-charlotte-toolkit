import React, { useState, useEffect } from 'react';
import FalconApi from '@crowdstrike/foundry-js';
import { SlButton, SlCard, SlTextarea, SlInput, SlIcon, SlSpinner, SlAlert, SlDivider } from '@shoelace-style/shoelace/dist/react';

const Page: React.FC = () => {
  const [falcon, setFalcon] = useState<FalconApi | null>(null);
  const [logs, setLogs] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFalcon = async () => {
      try {
        const api = new FalconApi();
        await api.connect();
        setFalcon(api);
      } catch (err) {
        setError('Failed to connect to Falcon.');
        console.error(err);
      }
    };
    initFalcon();
  }, []);

  const handleAnalyzeLogs = async () => {
    if (!falcon || !logs.trim()) return;

    setLoading(true);
    setError(null);
    // Add user log submission to chat for context
    const newHistory = [...chatHistory, { role: 'user' as const, content: `Analyze these logs:\n${logs}` }];
    setChatHistory(newHistory);

    try {
      const response = await falcon.functions.post('handle_triage_request', { logs: logs });

      if (response && response.status === 'success') {
          setChatHistory([...newHistory, { role: 'assistant', content: response.response }]);
      } else {
          setError(response?.message || 'Analysis failed.');
      }

    } catch (err) {
      setError('Error calling AI service.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!falcon || !chatInput.trim()) return;

    const message = chatInput;
    setChatInput('');
    setLoading(true);
    setError(null);

    const newHistory = [...chatHistory, { role: 'user' as const, content: message }];
    setChatHistory(newHistory);

    try {
        const response = await falcon.functions.post('handle_triage_request', { message: message });

        if (response && response.status === 'success') {
            setChatHistory([...newHistory, { role: 'assistant', content: response.response }]);
        } else {
            setError(response?.message || 'Chat failed.');
        }

    } catch (err) {
        setError('Error calling AI service.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
          <SlIcon name="shield-check" style={{ fontSize: '2rem', marginRight: '1rem', color: '#00b5e2' }} />
          <div>
            <h1 style={{ margin: 0 }}>AzureAI Toolkit Dashboard</h1>
            <p style={{ margin: 0, color: '#666' }}>Advanced Security Analysis & Chat</p>
          </div>
      </header>

      {error && (
            <SlAlert variant="danger" open style={{ marginBottom: '1rem' }}>
                <SlIcon slot="icon" name="exclamation-octagon" />
                {error}
            </SlAlert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Log Analysis Section */}
          <section>
              <SlCard className="full-height">
                  <div slot="header">
                      <h3>Log Analysis</h3>
                  </div>
                  <p>Paste raw logs or JSON snippets for immediate security assessment.</p>
                  <SlTextarea
                      rows={10}
                      placeholder="Paste logs here..."
                      value={logs}
                      onSlInput={(e: any) => setLogs(e.target.value)}
                  />
                  <div style={{ marginTop: '1rem' }}>
                      <SlButton variant="primary" onClick={handleAnalyzeLogs} disabled={loading || !logs.trim()}>
                          {loading ? <SlSpinner /> : 'Analyze Logs'}
                      </SlButton>
                  </div>
              </SlCard>
          </section>

          {/* Chat Interface Section */}
          <section>
              <SlCard className="full-height">
                  <div slot="header">
                      <h3>Security Assistant Chat</h3>
                  </div>

                  <div className="chat-window" style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {chatHistory.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>
                              <SlIcon name="chat" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                              <p>Ask me anything about security concepts, threat actors, or mitigation strategies.</p>
                          </div>
                      )}

                      {chatHistory.map((msg, idx) => (
                          <div key={idx} style={{
                              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                              background: msg.role === 'user' ? '#e6f7ff' : '#f5f5f5',
                              padding: '10px',
                              borderRadius: '8px',
                              maxWidth: '80%'
                          }}>
                              <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                          </div>
                      ))}
                      {loading && (
                           <div style={{ alignSelf: 'flex-start', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
                               <SlSpinner />
                           </div>
                      )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                      <SlInput
                          placeholder="Ask a security question..."
                          style={{ flex: 1 }}
                          value={chatInput}
                          onSlInput={(e: any) => setChatInput(e.target.value)}
                          onKeyDown={(e: any) => { if (e.key === 'Enter') handleChatSubmit(); }}
                      />
                      <SlButton variant="primary" onClick={handleChatSubmit} disabled={loading || !chatInput.trim()}>
                          Send
                      </SlButton>
                  </div>
              </SlCard>
          </section>
      </div>
    </div>
  );
};

export default Page;
