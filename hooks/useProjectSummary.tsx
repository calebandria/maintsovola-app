import { useEffect, useState } from "react";
import { supabase } from "~/lib/data_with_type";

interface ProjectCultureCount {
  name: string;
  count: number;
  fill: string;
}

interface ProjectCategoryData {
  count: number;
  area: number;
  funding: number;
  profit: number;
  ownerProfit: number;
  cultures: ProjectCultureCount[];
}

interface ProjectStatusData {
  enFinancement: ProjectCategoryData;
  enCours: ProjectCategoryData;
  termine: ProjectCategoryData;
}


const [projectsSummary, setProjectsSummary] = useState({
    totalProjects: 0,
    totalArea: 0,
    totalFunding: 0,
    totalProfit: 0,
    ownerProfit: 0,
    projectsByStatus: {
      enFinancement: {
        count: 0,
        area: 0,
        funding: 0,
        profit: 0,
        ownerProfit: 0,
        cultures: []
      },
      enCours: {
        count: 0,
        area: 0,
        funding: 0,
        profit: 0,
        ownerProfit: 0,
        cultures: []
      },
      termine: {
        count: 0,
        area: 0,
        funding: 0,
        profit: 0,
        ownerProfit: 0,
        cultures: []
      }
    } as ProjectStatusData,

    projectsByCulture: [] as Array<{
        name: string;
        count: number;
        fill: string;
    }>
  });


useEffect(()=> {
const fetchProjectsSummary = async (userId: string) => {
    try {
      const { data: projectsData , error } = await supabase
        .from('projet')
        .select(`
          id_projet,
          statut,
          surface_ha,
          cultures:projet_culture(
            culture:id_culture(*),
            cout_exploitation_previsionnel,
            rendement_previsionnel
          ),
          investissements:investissement(montant)
        `)
        .eq('id_tantsaha', userId);
        
      if (error) throw error;
      
      if (!projectsData) return;
      
      let totalArea = 0;
      let totalFunding = 0;
      let totalProfit = 0;
      
      const statusColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const cultureMap = new Map<string, { count: number, fill: string }>();
      
      // Initialize the categorized data structure
      const projectsByStatus = {
        enFinancement: {
          count: 0,
          area: 0,
          funding: 0,
          profit: 0,
          ownerProfit: 0,
          cultures: [] as Array<{ name: string, count: number, fill: string }>
        },
        enCours: {
          count: 0,
          area: 0,
          funding: 0,
          profit: 0,
          ownerProfit: 0,
          cultures: [] as Array<{ name: string, count: number, fill: string }>
        },
        termine: {
          count: 0,
          area: 0,
          funding: 0,
          profit: 0,
          ownerProfit: 0,
          cultures: []  as Array<{ name: string, count: number, fill: string }>
        }
      };
      
      // Maps for tracking cultures by project status
      const culturesByStatus = {
        enFinancement: new Map<string, number>(),
        enCours: new Map<string, number>(),
        termine: new Map<string, number>()
      };

      projectsData.forEach(project => {
        // Determine the status category
        let statusCategory: 'enFinancement' | 'enCours' | 'termine';
        if (project.statut === 'en financement') {
          statusCategory = 'enFinancement';
        } else if (project.statut === 'en_production' || project.statut === 'en_cours') {
          statusCategory = 'enCours';
        } else if (project.statut === 'terminé') {
          statusCategory = 'termine';
        } else {
          statusCategory = 'enFinancement'; // Default
        }
        
        // Sum up the area
        const area = project.surface_ha || 0;
        totalArea += area;
        projectsByStatus[statusCategory].area += area;
        
        // Count projects
        projectsByStatus[statusCategory].count += 1;
        
        // Calculate profit
        let projectProfit = 0;

        if (project.cultures && Array.isArray(project.cultures)) {
          project.cultures.forEach(pc => {
            if (pc.culture) {
              const cultureName = pc.culture.nom_culture;
              const rendement = pc.rendement_previsionnel || 0;
              const coutExploitation = pc.cout_exploitation_previsionnel || 0;
              const revenue = rendement * (pc.culture.prix_tonne || 0);
              const profit = revenue - coutExploitation;
              
              projectProfit += profit;
              
              // Count cultures
              if (!cultureMap.has(cultureName)) {
                const colorIndex = cultureMap.size % statusColors.length;
                cultureMap.set(cultureName, { count: 1, fill: statusColors[colorIndex] });
              } else {
                cultureMap.get(cultureName)!.count += 1;
              }
              
              // Count cultures by status
              if (!culturesByStatus[statusCategory].has(cultureName)) {
                culturesByStatus[statusCategory].set(cultureName, 1);
              } else {
                culturesByStatus[statusCategory].set(cultureName, 
                  culturesByStatus[statusCategory].get(cultureName)! + 1);
              }
            }
          });
        }
        
        totalProfit += projectProfit;
        projectsByStatus[statusCategory].profit += projectProfit;
        projectsByStatus[statusCategory].ownerProfit += projectProfit * 0.4; // 40% de bénéfice pour le propriétaire
        
        // Sum up funding
        let projectFunding = 0;
        if (project.investissements && Array.isArray(project.investissements)) {
          project.investissements.forEach(inv => {
            projectFunding += inv.montant || 0;
          });
        }
        
        totalFunding += projectFunding;
        projectsByStatus[statusCategory].funding += projectFunding;
      });
      
      // Prepare culture data for chart
      const projectsByCulture = Array.from(cultureMap.entries()).map(([name, info]) => ({
        name,
        count: info.count,
        fill: info.fill
      }));
      
      // Convert culture maps to arrays for each status category
      Object.keys(culturesByStatus).forEach((status) => {
        const statusKey = status as keyof typeof culturesByStatus;
        projectsByStatus[statusKey].cultures = Array.from(culturesByStatus[statusKey].entries())
          .map(([name, count], index) => ({
            name,
            count,
            fill: statusColors[index % statusColors.length]
          }));
      });
    

      setProjectsSummary({
        totalProjects: projectsData.length,
        totalArea,
        totalFunding,
        totalProfit,
        ownerProfit: totalProfit * 0.4, // 40% du profit total pour le propriétaire
        projectsByStatus,
        projectsByCulture
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des informations sur les projets:", error);
    }
  };
},

[])
 
  