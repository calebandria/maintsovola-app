// import { useEffect, useState } from 'react';
// import { supabase } from '~/lib/data';

// export interface ProjectInfo {
//   id_projet: string;
//   titre: string;
// }

// export interface Investment {
//   id_investissement: string;
//   id_projet: string;
//   montant: number;
//   date_decision_investir: string;
//   statut_paiement: string;
//   projet: ProjectInfo;
// }

// export interface PendingPayment {
//   id_investissement: string;
//   id_projet: string;
//   montant: number;
//   date_investissement: string;
//   projet: ProjectInfo;
// }

// export const useUserInvestments = (userId: string) => {
//   const [investments, setInvestments] = useState<Investment[]>([]);
//   const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchInvestments = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // Fetch investments made by the user
//         const { data: userInvestments, error: investmentsError } = await supabase
//           .from('investissement')
//           .select('id_investissement, id_projet, montant, date_decision_investir, statut_paiement, projet:id_projet(id_projet, titre)')
//           .eq('id_investisseur', userId);

//         if (investmentsError) throw investmentsError;

//         if (!userInvestments || userInvestments.length === 0) {
//           setInvestments([]);
//           setPendingPayments([]);
//         //   console.log('hvjdsjhdvsjkdhvsqkdjhsvqkjsqhvfdkjsqhvfkqs')
//           return;
//         }

//         // Format investments data
//         const formattedInvestments = userInvestments.map(inv => ({
//           ...inv,
//           projet: Array.isArray(inv.projet) ? inv.projet[0] : inv.projet,
          
//         })) as Investment[];

//         setInvestments(formattedInvestments);
//         // console.log('Investissements récupérés:', formattedInvestments);
//         // Get pending payments (investments without payment)
//         const pendingPaymentsData = formattedInvestments
//           .filter(inv => inv.statut_paiement !== 'payé')
//           .map(inv => ({
//             id_investissement: inv.id_investissement,
//             id_projet: inv.id_projet,
//             montant: inv.montant,
//             date_investissement: inv.date_decision_investir,
//             projet: inv.projet
//           }));

//         setPendingPayments(pendingPaymentsData);
//         // console.log('Paiements en attente récupérés:', pendingPaymentsData);

//       } catch (err) {
//         console.error('Error fetching investments:', err);
//         setError(err instanceof Error ? err.message : 'Unknown error occurred');
//         setInvestments([]);
//         setPendingPayments([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (userId) {
//       fetchInvestments();
//     //   console.log('Fetching investments for user:', userId);

//     } else {
//       setError('No user ID provided');
//       setLoading(false);
//     }
//   }, [userId]);

//   return { investments, pendingPayments, loading, error };
// };
import { useState, useEffect } from 'react';
import { supabase } from '~/lib/data'; // Make sure this path is correct for your RN project

type NextPaymentDueType = {
  amount: number;
  date: string;
  project: string | any;
}
interface PaymentMetrics {
  totalInvested: number;
  totalPaid: number;
  pendingPayments: number;
  thisMonthPaid: number;
  nextPaymentDue?: NextPaymentDueType | undefined;
}

interface PaymentTrend {
  month: string;
  amount: number;
}

interface PaymentMethod {
  name: string;
  value: number;
  fill: string;
}

export const usePaymentData = (userId: string) => {
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalInvested: 0,
    totalPaid: 0,
    pendingPayments: 0,
    thisMonthPaid: 0,
  });
  
  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Get user investments
        const { data: investments, error: investmentsError } = await supabase
          .from('investissement')
          .select('montant, statut_paiement, date_decision_investir, projet:id_projet(titre)')
          .eq('id_investisseur', userId);

        if (investmentsError) {
          console.error('Error fetching investments:', investmentsError);
          return;
        }

        // Get payment history
        const { data: payments, error: paymentsError } = await supabase
          .from('historique_paiement_invest')
          .select('montant, methode_paiement, date_paiement')
          .eq('numero_telephone', userId);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          return;
        }

        if (investments) {
          const totalInvested = investments.reduce((sum, inv) => sum + inv.montant, 0);
          const pendingInvestments = investments.filter(inv => inv.statut_paiement !== 'payé');
          const pendingPayments = pendingInvestments.reduce((sum, inv) => sum + inv.montant, 0);

          // Calculate amount paid this month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const thisMonthPaid = payments
            ?.filter(payment => {
              const paymentDate = new Date(payment.date_paiement);
              return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            })
            ?.reduce((sum, payment) => sum + payment.montant, 0) || 0;

          const totalPaid = payments?.reduce((sum, payment) => sum + payment.montant, 0) || 0;

          // Next due payment (simulated)
          const nextPaymentDue : NextPaymentDueType | undefined = pendingInvestments.length > 0 ? {
            amount: pendingInvestments[0].montant,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            project: pendingInvestments[0].projet?.titre || 'Projet inconnu'
          } : undefined;

          setMetrics({
            totalInvested,
            totalPaid,
            pendingPayments,
            thisMonthPaid,
            nextPaymentDue
          });
        }

        // Calculate payment trends (last 6 months)
        if (payments) {
          const trends: { [key: string]: number } = {};
          const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          
          payments.forEach(payment => {
            const date = new Date(payment.date_paiement);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            trends[monthKey] = (trends[monthKey] || 0) + payment.montant;
          });

          const trendData = Object.entries(trends)
            .sort((a, b) => {
              const [monthA, yearA] = a[0].split(' ');
              const [monthB, yearB] = b[0].split(' ');
              const monthIndexA = monthNames.indexOf(monthA);
              const monthIndexB = monthNames.indexOf(monthB);
              return new Date(parseInt(yearA), monthIndexA).getTime() - new Date(parseInt(yearB), monthIndexB).getTime();
            })
            .slice(-6)
            .map(([month, amount]) => ({ month, amount }));
          
          setPaymentTrends(trendData);

          // Calculate payment method distribution
          const methodCounts: { [key: string]: number } = {};
          payments.forEach(payment => {
            methodCounts[payment.methode_paiement] = (methodCounts[payment.methode_paiement] || 0) + payment.montant;
          });

          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
          const methodData = Object.entries(methodCounts).map(([name, value], index) => ({
            name,
            value,
            fill: colors[index % colors.length]
          }));

          setPaymentMethods(methodData);
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [userId]);

  return {
    metrics,
    paymentTrends,
    paymentMethods,
    loading
  };
};