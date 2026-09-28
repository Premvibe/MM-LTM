import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, CheckCircle2, UserCheck, FileText, Lock, Users, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">Data Protection Policy</h1>
            </div>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mt-2">
              Manzil Mystics Foundation
            </p>
          </div>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="rounded-xl h-12 px-6 border-gray-200 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-bold">Go Back</span>
          </Button>
        </div>

        {/* Content */}
        <div className="grid gap-6">
          <Card className="p-8 md:p-12 border-none shadow-xl rounded-[2rem] bg-white">
            <div className="space-y-12">
              
              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">1</span> 
                  Purpose of the Policy
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p>
                    This policy is designed to ensure the protection, responsible use, and ethical handling of personal data of all individuals associated with Manzil Mystics especially children, youth, parents, educators, and community members. The policy aligns with the Digital Personal Data Protection (DPDP) Act, 2023 and reflects our commitment to data dignity, transparency, and accountability in every interaction.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">2</span> 
                  Scope and Applicability
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-2">This policy applies to:</p>
                  <ul className="space-y-2 list-none">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                      <span>All employees, fellows, consultants, volunteers, and interns of Manzil Mystics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                      <span>All data collected or processed through our programs, including in-school, after-school initiatives, events</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">3</span> 
                  Principles of Data Protection
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <ul className="space-y-4 list-none">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block mb-1">Consent-Driven Collection</strong>
                        We collect personal data only with free, specific, informed, and revocable consent. We only take consent if it is required by our CSR or any other partners.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block mb-1">Purpose Limitation</strong>
                        Data is collected for defined programmatic or compliance needs only.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block mb-1">Data Minimization</strong>
                        Only essential data is collected such as names, age, school, city, and contact information when necessary.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block mb-1">Anonymization</strong>
                        All impact reporting uses anonymized, coded data to protect individual identities.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-slate-900 block mb-1">Secure Handling</strong>
                        Data is stored and processed with reasonable safeguards to prevent unauthorized access or misuse.
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">4</span> 
                  Unique Beneficiary Codes
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-4">
                    Every child or beneficiary is tracked using a unique MIS code that removes the need to store personal identifiers during internal reporting:
                  </p>
                  
                  <div className="grid gap-4 sm:grid-cols-3 mb-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2">In-School</h4>
                      <code className="text-xs font-mono bg-white px-2 py-1 rounded text-primary block mb-2">MM_IS_YYYYMM_####</code>
                      <p className="text-xs">Ex: Workshop on 15th Dec 2023 with serial no. 19 = MM_IS_202312_0019</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2">After-School</h4>
                      <code className="text-xs font-mono bg-white px-2 py-1 rounded text-primary block mb-2">MM_AS_YYYYMM_####</code>
                      <p className="text-xs">Ex: Session in Jan 2024 with SNo. 45 = MM_AS_202401_0045</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2">Event</h4>
                      <code className="text-xs font-mono bg-white px-2 py-1 rounded text-primary block mb-2">MM_EV_YYYYMM_####</code>
                      <p className="text-xs">Ex: Event in Feb 2024 with SNo. 110 = MM_AS_202402_0110</p>
                    </div>
                  </div>
                  
                  <p className="italic text-xs">
                    This practice ensures anonymity while allowing robust monitoring of participation and impact.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">5</span> 
                  Types of Personal Data Collected
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-3">
                    In compliance with the DPDP Act, 2023, the following data categories are considered personal and are only collected after consent:
                  </p>
                  <ul className="space-y-2 list-none">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
                      <span>Name, phone number, address</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
                      <span>Gender, age, school name</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
                      <span>Photographs, videos, or audio recordings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div>
                      <span>Aadhaar or other identity documents (only if mandated)</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">6</span> 
                  Rights of the Data Principal (Beneficiary)
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-3">Every beneficiary has the right to:</p>
                  <ul className="space-y-2 list-none mb-4">
                    <li className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Know what data is collected and why</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Access or request correction/deletion of their data</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Withdraw consent at any time</span>
                    </li>
                  </ul>
                  <p className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-blue-800 font-medium text-xs">
                    For children under 18, consent is taken from school/partner, parents or legal guardians.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">7</span> 
                  Data Management Committee
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-3">
                    Manzil Mystics has constituted a Data Management Committee to uphold the principles of this policy and oversee all sensitive data operations. The committee includes:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">Program Director</span>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">CEO</span>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">HR Manager</span>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">One Board Member (nominated annually)</span>
                  </div>
                  <p>
                    This committee also reviews data breach incidents, data sharing requests, and ensures periodic audits of our data practices.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">8</span> 
                  Data Sharing & Partner Access
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-3">To protect beneficiaries' privacy:</p>
                  <ul className="space-y-3 list-none">
                    <li className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>No personal information (e.g., names, phone numbers) will be shared with external donors or partners without prior written consent.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>When needed, Manzil Mystics facilitates visits or interviews, ensuring transparency and respect for the individual's privacy.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Impact stories or case studies are anonymized unless explicit consent is received.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">9</span> 
                  Data Sharing Agreements (DSA)
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-3">
                    Every CSR partner requesting access to data must sign a Data Sharing Agreement at the time of the agreement, which includes:
                  </p>
                  <ul className="space-y-2 list-none mb-3">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div><span>What data will be shared and for what purpose</span></li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div><span>Consent protocols followed</span></li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div><span>Security, storage, and deletion requirements</span></li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></div><span>Responsibilities in case of breach</span></li>
                  </ul>
                  <p className="italic text-xs">
                    This protects both the beneficiaries and the partnering organizations from legal non-compliance.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm">10</span> 
                  Security & Confidentiality
                </h2>
                <div className="pl-11 text-slate-600 text-sm leading-relaxed">
                  <p className="mb-3">
                    All personal data is stored on encrypted drives or secure cloud systems accessible only to authorized Manzil Mystics team members. No employee is allowed to:
                  </p>
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                    <ul className="space-y-2 list-none text-red-800 font-medium">
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Share raw data externally</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Transfer data to personal devices without approval</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Use data beyond its stated purpose</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                <section className="space-y-3">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">11. Review and Updates</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    This policy will be reviewed every 12 months or earlier if required due to legislative changes or internal needs. All changes will be communicated to staff via email or through quarterly department meetings.
                  </p>
                </section>
                
                <section className="space-y-3">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">12. Policy Ownership</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    This policy has been created by the Core Team and approved by the Data Management Committee of Manzil Mystics. Any questions should be directed to the HR Manager or Program Director.
                  </p>
                </section>
              </div>
              
              <div className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10 mt-8">
                <p className="text-primary font-bold italic">
                  "At Manzil Mystics, we believe that data protection is not just a legal obligation, it's a reflection of the dignity and trust we strive to uphold in every child's story."
                </p>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
