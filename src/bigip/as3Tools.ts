/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AdcDeclaration, As3AppMap, As3AppMapTenants } from "./as3Models";

import { isObject } from "../utils/misc";





/**
 * returns true if working with targets
 * @param declare /declare endpoint output
 */
 export async function targetDecsBool(declare: AdcDeclaration | AdcDeclaration[]): Promise<boolean> {

	// if array from bigiq/targets, assign, else put in array
	const declareArray: AdcDeclaration[] = Array.isArray(declare) ? declare : [declare];

	if (declareArray[0]?.target as boolean) {
		return true;
	} else {
		return false;
	}
}



/**
 * returns as3 application index of target?/tenant/app/app-stats
 * 
 * ```ts
 * 
 * ```
 * 
 * @param declare /declare endpoint output
 */
 export async function mapAs3(declare: AdcDeclaration | AdcDeclaration[]): Promise<As3AppMap> {

	// if array from bigiq/targets, assign, else put in array
	const declareArray: AdcDeclaration[] = Array.isArray(declare) ? declare : [declare];

	const as3Map: As3AppMap = {};

	/**
	 * this map represents what I feel is a more modern approach to building json structures.  The F5 ATC method for building json structures heavily utilizes named objects which can be very difficult to crawl/discover, since one has to constantly loop and check to see what kind of data the key holds.  This method can be very clean and concise
	 * 
	 * The other method, which seems to be the more common method, makes the structure bigger but more predictable without having to inspect each object param to see what kind it is.  !Example, the github api has many nested objects and lists, but rarely any 'named' objects.  This predictable structure of object keys makes it way easier to type objects for typescript and get information from within the structure without having to discover each key/value (just look for the key, not inspect the keys value for another key/value pair).
	 * 
	 * This new map is not returned as part of the function output, but built within this function as a demonstration and excercise to explore both options.  The thought it to move this function to f5-conx-core and utilize across the projects
	 */
	const as3MapNew = [];

	// go through each item in the targets array
	declareArray.map((el: any) => {

		const tenants: As3AppMap = {};
		const tenantsNew: As3AppMapTenants[] = [];

		// get target if defined
		const target
			= el?.target?.address ? el.target.address
				: el?.target?.hostname ? el.target.hostname
					: undefined;

		// loop through declaration (adc) level
		Object.entries(el).forEach(([key, val]) => {

			// named object for each tenant
			if (isObject(val) && key !== 'target' && key !== 'controls') {

				let apps2: any = {};
				let appsNew: { app: string; components: {}; }[] = [];

				// loop through items of the tenant
				Object.entries(val as object).forEach(([tKey, tVal]) => {

					// if we are at an application object
					if (isObject(tVal)) {
						const appProps: any = {};

						// loop through the items of the application
						Object.entries(tVal).forEach(([aKey, aVal]) => {

							// look at the objects (application pieces)
							if (isObject(aVal) && (aVal as { class: string })?.class) {

								const appVal: { class: string } = aVal as { class: string };

								// capture the class of each application piece
								if (appVal?.class in appProps) {
									// already have this key, so add one
									appProps[appVal.class] = appProps[appVal.class] + 1;
								} else {
									// key not detected, so create it
									appProps[appVal.class] = 1;
								}
							}
						});
						apps2[tKey] = appProps;
						appsNew.push({
							app: tKey,
							components: appProps
						});
					}
				});
				tenants[key] = apps2;
				tenantsNew.push({
					tenant: key,
					apps: appsNew
				});
			}
		});

		if (target) {
			as3Map[target] = tenants;
			as3MapNew.push({
				target,
				tenants: tenantsNew
			});
		} else {
			Object.assign(as3Map, tenants);
			as3MapNew.push(...tenantsNew);
		}

	});
	return as3Map;
}


export async function as3AppsInTenant(as3Tenant: object): Promise<string[]> {
	const apps: string[] = [];

	// loop through the items of the tenant
	Object.entries(as3Tenant).forEach(([aKey, aVal]) => {
		// look at the objects (application pieces)
		if (isObject(aVal)) {
			apps.push(aKey);
		}
	});

	return apps;
}

export async function as3AppStats(as3App: object): Promise<object | undefined> {

	const appProps: any = {};

	// loop through the items of the application
	Object.entries(as3App).forEach(([aKey, aVal]) => {

		// look at the objects (application pieces)
		if (isObject(aVal) && (aVal as { class: string })?.class) {

			const appVal: { class: string } = aVal as { class: string };

			// capture the class of each application piece
			if (appVal?.class in appProps) {
				// already have this key, so add one
				appProps[appVal.class] + 1;
			} else {
				// key not detected, so create it
				appProps[appVal.class] = 1;
			}
		}
	});

	return appProps;
}

