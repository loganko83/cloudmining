import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Xphere Cloud Mining은 어떻게 작동하나요?",
    answer: "Xphere Cloud Mining은 사용자가 고가의 채굴 장비를 직접 구매하고 관리할 필요 없이, 당사의 데이터센터에 구축된 ASIC XP1 채굴기의 해시파워를 임대하여 XP 코인을 채굴하는 서비스입니다."
  },
  {
    question: "수익 정산은 언제 이루어지나요?",
    answer: "채굴 수익은 매일 한국 시간 기준 14:00에 정산되며, 사용자의 내부 지갑으로 자동 입금됩니다. 외부 지갑으로의 출금은 언제든지 신청 가능합니다."
  },
  {
    question: "최소 출금 가능 금액은 얼마인가요?",
    answer: "최소 출금 금액은 100 XP입니다. 이는 블록체인 네트워크 수수료를 고려한 정책입니다."
  },
  {
    question: "채굴기 유지보수 비용은 별도로 청구되나요?",
    answer: "아니요, 마켓에 표시된 채굴기 구매 가격에는 계약 기간 동안의 전기료, 유지보수 비용, 데이터센터 운영비가 모두 포함되어 있습니다."
  },
  {
    question: "XP 코인의 가격은 어떻게 결정되나요?",
    answer: "XP 코인의 가격은 거래소 시장 가격에 따라 변동됩니다. 대시보드에서 제공하는 USDT 환산 가치는 CoinGecko 등의 오라클 데이터를 기반으로 합니다."
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center">
          <HelpCircle className="mr-2 text-blue-500" />
          자주 묻는 질문 (FAQ)
        </h2>
        <p className="text-slate-400 mt-2">서비스 이용에 대해 궁금한 점을 확인하세요.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden transition-all duration-200"
          >
            <button
              className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-medium text-slate-200">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5 text-blue-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </button>
            <div 
              className={`px-5 text-slate-400 text-sm overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {faq.answer}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 text-center mt-12">
        <p className="text-slate-300 mb-4">더 궁금한 점이 있으신가요?</p>
        <button className="text-blue-400 hover:text-blue-300 font-medium underline">
          고객센터 문의하기
        </button>
      </div>
    </div>
  );
};