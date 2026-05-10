"use client"

import { Navbar } from "@/components/navbar"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

export default function PricingPage() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main className="pt-20">
        <PricingSection />
        
        {/* Additional Pricing Content */}
        <section className="px-6 pb-20 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border-2 border-foreground bg-background p-8 lg:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-xl lg:text-2xl font-mono font-bold uppercase mb-8 border-b-2 border-foreground pb-4">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <FaqItem 
                index={0}
                question="How does voice cloning work?" 
                answer="Our advanced AI analyzes 30 seconds of audio to create a digital fingerprint of your voice. This is then used to synthesize speech that sounds exactly like you, preserving your unique tone and cadence."
              />
              <FaqItem 
                index={1}
                question="Can I cancel my subscription?" 
                answer="Yes, you can cancel at any time from your dashboard. Your clones will remain accessible until the end of your billing period, after which they will be archived."
              />
              <FaqItem 
                index={2}
                question="What is a 'Memory Entry'?" 
                answer="A memory entry is a piece of information or context you provide to your clone. This could be a personal fact, a professional achievement, or a specific way you respond to certain situations."
              />
              <FaqItem 
                index={3}
                question="Is my data secure?" 
                answer="Security is our top priority. All voice and personality data is encrypted at rest and in transit. We never sell your data to third parties, and you maintain full ownership of your clones."
              />
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
      className="flex flex-col gap-2"
    >
      <h3 className="text-sm font-mono font-bold uppercase text-[#ea580c]">
        {`> ${question}`}
      </h3>
      <p className="text-xs font-mono text-muted-foreground leading-relaxed">
        {answer}
      </p>
    </motion.div>
  )
}
