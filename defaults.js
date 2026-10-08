/** Starting proposals requested by the owner. Not measured vessel data or safety limits. */
export function suggestedProfile(){return {
 name:'Waterwolf',proposal:true,draft:1.4,clearance:.5,noGo:55,tackLoss:90,gybeLoss:120,referenceWindKnots:12,
 sails:[{name:'Voorstel · basis',sails:['Grootzeil (bevestigen)','Fok (bevestigen)'],minWindKn:0,maxWindKn:14.9},{name:'Voorstel · minder zeil',sails:['Gereefd grootzeil (bevestigen)','Fok (bevestigen)'],minWindKn:15,maxWindKn:25}],
 polar:[{twa:55,speedKnots:3},{twa:70,speedKnots:4},{twa:90,speedKnots:5},{twa:120,speedKnots:5},{twa:150,speedKnots:4.5},{twa:180,speedKnots:3.5}]
};}
