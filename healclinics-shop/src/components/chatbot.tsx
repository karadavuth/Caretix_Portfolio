'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'shipping' | 'returns' | 'contact';
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'Wat zijn de verzendkosten en levertijd?',
    answer: 'Wij bieden gratis verzending aan vanaf €50. Bestellingen worden binnen 1-2 werkdagen geleverd in Nederland via PostNL.',
    category: 'shipping'
  },
  {
    id: '2', 
    question: 'Wat is het retourbeleid?',
    answer: 'Je kunt producten binnen 30 dagen retourneren. Contacteer ons via info@healclinics.nl voor een retourlabel. Geld wordt binnen 5 werkdagen teruggestort.',
    category: 'returns'
  },
  {
    id: '3',
    question: 'Hoe kan ik HealClinics bereiken?',
    answer: 'Je kunt ons bereiken via email: info@healclinics.nl, telefoon: 020-1234567 (ma-vr 9-17u), of via het contactformulier op onze website.',
    category: 'contact'
  }
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  return (
    <>
      {/* Chatbot Bubble */}
      <div className="chatbot-container">
        {/* Chat Panel */}
        {isOpen && (
          <div className="chatbot-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">HealClinics Support</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedFAQ ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Hoe kunnen we je helpen? Kies een van de veelgestelde vragen:
                </p>
                <div className="space-y-2">
                  {faqs.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => setSelectedFAQ(faq)}
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Niet gevonden wat je zocht? 
                    <a href="/contact" className="text-green-600 hover:text-green-700 ml-1">
                      Neem contact op
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <button 
                    onClick={() => setSelectedFAQ(null)}
                    className="text-sm text-green-600 hover:text-green-700 mb-2"
                  >
                    ← Terug naar vragen
                  </button>
                  <h4 className="font-medium mb-2">{selectedFAQ.question}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedFAQ.answer}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Was dit helpful? 
                    <a href="/contact" className="text-green-600 hover:text-green-700 ml-1">
                      Meer hulp nodig?
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="chatbot-bubble"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
