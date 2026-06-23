import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializePrintCostDatabase } from './app/core/db/printcost-db';

bootstrapApplication(AppComponent, appConfig)
  .then(() =>
    initializePrintCostDatabase().catch((error) => {
      console.error('Failed to initialize local database', error);
    })
  )
  .catch((error) => console.error(error));
