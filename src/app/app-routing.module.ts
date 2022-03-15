import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { DetailsComponent } from './details/details.component';
import { ProductComponent } from './product/product.component';

const routes: Routes = [
  {path:'',component:ProductComponent},
  {path:'product',component:ProductComponent},
  {path:'details',component:DetailsComponent},
  {path:'cart',component:CartComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
