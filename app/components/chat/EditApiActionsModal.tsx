import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Label } from '~/components/ui/Label';
import { Input } from '~/components/ui/Input';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import yaml from 'js-yaml';
import React from 'react';
import type { ApiActions, ApiKeyAuth, OtherAuth } from '~/types/ApiTypes';

interface Action {
  name: string;
  method: string;
  path: string;
  summary: string;
}

interface EditActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiConfig: ApiActions) => void;
  onAfterSave?: (apiConfig: ApiActions) => void;
  editingApi?: ApiActions;
}

export default function EditActionsModal({ isOpen, onClose, onSave, onAfterSave, editingApi }: EditActionsModalProps) {
  const [apiName, setApiName] = useState('');
  const [schemaContent, setSchemaContent] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  const [authType, setAuthType] = useState<ApiActions['authType']>('none');

  // API Key auth state
  const [apiKeyAuthType, setApiKeyAuthType] = useState<ApiKeyAuth['authType']>('bearer');
  const [apiKey, setApiKey] = useState('');
  const [customHeaderName, setCustomHeaderName] = useState('X-API-Key');

  // Other auth state
  const [otherAuth, setOtherAuth] = useState<OtherAuth>({
    description: '',
    headers: {},
    queryParams: {},
  });
  const [otherAuthHeadersText, setOtherAuthHeadersText] = useState('');
  const [otherAuthQueryParamsText, setOtherAuthQueryParamsText] = useState('');

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Load editing API data if provided
  useEffect(() => {
    if (editingApi) {
      setApiName(editingApi.name);
      setSchemaContent(editingApi.schema);
      setAuthType(editingApi.authType);
      setActions(editingApi.actions);
      setServerUrl(editingApi.serverUrl || '');

      // Load API Key auth data if available
      if (editingApi.apiKeyAuth) {
        setApiKeyAuthType(editingApi.apiKeyAuth.authType);
        setApiKey(editingApi.apiKeyAuth.key || '');

        if (editingApi.apiKeyAuth.customHeaderName) {
          setCustomHeaderName(editingApi.apiKeyAuth.customHeaderName);
        }
      }

      // Load Other auth data if available
      if (editingApi.otherAuth) {
        setOtherAuth({
          description: editingApi.otherAuth.description || '',
          headers: editingApi.otherAuth.headers || {},
          queryParams: editingApi.otherAuth.queryParams || {},
        });

        setOtherAuthHeadersText(
          editingApi.otherAuth.headers ? JSON.stringify(editingApi.otherAuth.headers, null, 2) : '',
        );

        setOtherAuthQueryParamsText(
          editingApi.otherAuth.queryParams ? JSON.stringify(editingApi.otherAuth.queryParams, null, 2) : '',
        );
      }
    } else {
      // Reset form for new API
      setApiName('');
      setSchemaContent('');
      setAuthType('none');
      setActions([]);
      setServerUrl('');
    }
  }, [editingApi]);

  // Update otherAuth object when text fields change
  useEffect(() => {
    try {
      const headers = otherAuthHeadersText.trim() ? JSON.parse(otherAuthHeadersText) : {};
      const queryParams = otherAuthQueryParamsText.trim() ? JSON.parse(otherAuthQueryParamsText) : {};

      setOtherAuth((prev) => ({
        ...prev,
        headers,
        queryParams,
      }));
    } catch (error) {
      console.error('Error parsing headers or query params:', error);
    }
  }, [otherAuthHeadersText, otherAuthQueryParamsText]);

  const exampleSchema = `openapi: 3.1.0
info:
  title: NWS Weather API
  description: Access to weather data including forecasts, alerts, and observations.
  version: 1.0.0
servers:
  - url: https://api.weather.gov
    description: Main API Server
paths:
  /points/{latitude},{longitude}:
    get:
      operationId: getPointData
      summary: Get forecast grid endpoints for a specific location
      parameters:
        - name: latitude
          in: path
          required: true
          schema:
            type: number
            format: float
          description: Latitude of the point
        - name: longitude
          in: path
          required: true
          schema:
            type: number
            format: float
          description: Longitude of the point
      responses:
        '200':
          description: Successfully retrieved grid endpoints
          content:
            application/json:
              schema:
                type: object
                properties:
                  properties:
                    type: object
                    properties:
                      forecast:
                        type: string
                        format: uri
                      forecastHourly:
                        type: string
                        format: uri
                      forecastGridData:
                        type: string
                        format: uri

  /gridpoints/{office}/{gridX},{gridY}/forecast:
    get:
      operationId: getGridpointForecast
      summary: Get forecast for a given grid point
      parameters:
        - name: office
          in: path
          required: true
          schema:
            type: string
          description: Weather Forecast Office ID
        - name: gridX
          in: path
          required: true
          schema:
            type: integer
          description: X coordinate of the grid
        - name: gridY
          in: path
          required: true
          schema:
            type: integer
          description: Y coordinate of the grid
      responses:
        '200':
          description: Successfully retrieved gridpoint forecast
          content:
            application/json:
              schema:
                type: object
                properties:
                  properties:
                    type: object
                    properties:
                      periods:
                        type: array
                        items:
                          type: object
                          properties:
                            number:
                              type: integer
                            name:
                              type: string
                            startTime:
                              type: string
                              format: date-time
                            endTime:
                              type: string
                              format: date-time
                            temperature:
                              type: integer
                            temperatureUnit:
                              type: string
                            windSpeed:
                              type: string
                            windDirection:
                              type: string
                            icon:
                              type: string
                            shortForecast:
                              type: string
                            detailedForecast:
                              type: string`;

  const parseSchema = (content: string): Action[] => {
    setParseError(null);

    if (!content.trim()) {
      return [];
    }

    try {
      // Try to parse as JSON first
      let parsed;

      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // If JSON parsing fails, try YAML

        console.log(e);

        try {
          parsed = yaml.load(content);
        } catch (yamlError: any) {
          setParseError(`Error parsing schema: ${yamlError.message}`);
          return [];
        }
      }

      // Check if it's an OpenAPI schema with paths
      if (parsed && typeof parsed === 'object' && parsed.paths) {
        const extractedActions: Action[] = [];

        // Try to get API name from info.title if available
        if (parsed.info && parsed.info.title && !apiName) {
          setApiName(parsed.info.title);
        }

        // Try to extract server URL if available
        if (parsed.servers && Array.isArray(parsed.servers) && parsed.servers.length > 0) {
          const firstServer = parsed.servers[0];

          if (firstServer && firstServer.url) {
            setServerUrl(firstServer.url);
          }
        }

        // Iterate through paths and methods
        Object.entries(parsed.paths).forEach(([path, pathObj]: [string, any]) => {
          // Check for HTTP methods (get, post, put, delete, etc.)
          const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

          methods.forEach((method) => {
            if (pathObj && pathObj[method]) {
              const operation = pathObj[method];
              const operationId = operation.operationId || `${method}${path.replace(/\W+/g, '')}`;
              const summary = operation.summary || operation.description || '';

              extractedActions.push({
                name: operationId,
                method: method.toUpperCase(),
                path,
                summary,
              });
            }
          });
        });

        return extractedActions;
      } else {
        // Try to extract paths from non-standard schema format
        const extractedActions: Action[] = [];

        // Look for patterns that might indicate API endpoints
        const pathRegex = /\/[\w/{},]+/g;
        const methodRegex = /\b(GET|POST|PUT|DELETE|PATCH)\b/gi;

        const paths = content.match(pathRegex) || [];
        const methods = content.match(methodRegex) || [];

        // If we found paths but not methods, assume GET for all
        if (paths.length > 0 && methods.length === 0) {
          paths.forEach((path, index) => {
            extractedActions.push({
              name: `operation${index + 1}`,
              method: 'GET',
              path,
              summary: '',
            });
          });
        }

        return extractedActions;
      }
    } catch (error: any) {
      setParseError(`Error parsing schema: ${error.message}`);
      return [];
    }
  };

  useEffect(() => {
    if (!schemaContent.trim()) {
      setActions([]);
      return;
    }

    const parsedActions = parseSchema(schemaContent);
    setActions(parsedActions);
  }, [schemaContent]);

  const handleLoadExample = () => {
    if (schemaContent.trim() !== '') {
      setConfirmDialogOpen(true);
    } else {
      setSchemaContent(exampleSchema);
    }
  };

  const handleSave = () => {
    const apiConfig: ApiActions = {
      id: editingApi?.id,
      name: apiName || 'Unnamed API',
      actions,
      authType,
      schema: schemaContent,
      serverUrl,
    };

    // Add API Key auth data if applicable
    if (authType === 'apiKey') {
      apiConfig.apiKeyAuth = {
        key: apiKey,
        authType: apiKeyAuthType,
        ...(apiKeyAuthType === 'custom' && { customHeaderName }),
      };
    }

    // Add Other auth data if applicable
    if (authType === 'other') {
      apiConfig.otherAuth = otherAuth;
    }

    onSave(apiConfig);

    // Call the onAfterSave callback if provided
    if (onAfterSave) {
      onAfterSave(apiConfig);
    }
  };

  // Type-safe handlers for RadioGroup
  const handleAuthTypeChange = (value: string) => {
    setAuthType(value as ApiActions['authType']);
  };

  const handleApiKeyAuthTypeChange = (value: string) => {
    setApiKeyAuthType(value as ApiKeyAuth['authType']);
  };

  return (
    <>
      <DialogRoot
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <Dialog className="w-full max-w-6xl max-h-[90vh] overflow-auto" onClose={onClose}>
          <div className="p-6 w-full">
            <DialogTitle className="text-xl font-bold text-center mb-4">Edit actions</DialogTitle>
            <DialogDescription className="text-center text-gray-500 mb-4">
              {/* TODO: add description about what is openapi schema and add a link to 1. the openapi schema docs 2. Actions GPTs*/}
              {/* TODO: integrate Actions GPTs? */}
            </DialogDescription>

            <div className="space-y-5 py-2">
              <div>
                <Label htmlFor="apiName" className="text-base font-semibold mb-1.5 block">
                  API Name
                </Label>
                <Input
                  id="apiName"
                  placeholder="Enter API name"
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <h2 className="text-base font-semibold mb-1.5">Authentication</h2>
                <div className="space-y-4">
                  <RadioGroup value={authType} onValueChange={handleAuthTypeChange} className="flex gap-8">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">None</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="apiKey" id="apiKey" />
                      <Label htmlFor="apiKey">API Key</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>

                  {authType === 'apiKey' && (
                    <>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="[HIDDEN]"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Auth Type</Label>
                        <RadioGroup
                          value={apiKeyAuthType}
                          onValueChange={handleApiKeyAuthTypeChange}
                          className="flex gap-8"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="basic" id="basic" />
                            <Label htmlFor="basic">Basic</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bearer" id="bearer" />
                            <Label htmlFor="bearer">Bearer</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <Label htmlFor="custom">Custom</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      {apiKeyAuthType === 'custom' && (
                        <div className="space-y-2">
                          <Label htmlFor="customHeaderName">Custom Header Name</Label>
                          <Input
                            id="customHeaderName"
                            type="text"
                            placeholder="X-API-Key"
                            value={customHeaderName}
                            onChange={(e) => setCustomHeaderName(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {authType === 'other' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otherAuthDescription">Description</Label>
                        <textarea
                          id="otherAuthDescription"
                          className="w-full p-2 border rounded-md resize-none"
                          placeholder="Describe the authentication method"
                          value={otherAuth.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setOtherAuth((prev) => ({ ...prev, description: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherAuthHeaders">Headers (JSON format)</Label>
                        <textarea
                          id="otherAuthHeaders"
                          className="w-full p-2 border rounded-md resize-none"
                          placeholder='{"Authorization": "value", "X-Custom-Header": "value"}'
                          value={otherAuthHeadersText}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setOtherAuthHeadersText(e.target.value)
                          }
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="otherAuthQueryParams">Query Parameters (JSON format)</Label>
                        <textarea
                          id="otherAuthQueryParams"
                          className="w-full p-2 border rounded-md resize-none"
                          placeholder='{"api_key": "value", "token": "value"}'
                          value={otherAuthQueryParamsText}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setOtherAuthQueryParamsText(e.target.value)
                          }
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h2 className="text-base font-semibold">Schema</h2>
                  <Button
                    variant="outline"
                    className="rounded-full flex items-center gap-1 text-sm py-1 px-3 h-auto"
                    onClick={handleLoadExample}
                  >
                    Example
                  </Button>
                </div>

                <Card className="border rounded-lg p-2 mb-1.5">
                  <textarea
                    value={schemaContent}
                    onChange={(e) => setSchemaContent(e.target.value)}
                    className="min-h-[150px] w-full font-mono text-sm resize-y border-0 p-0 bg-transparent focus:outline-none"
                    style={{ resize: 'vertical' }}
                  />
                </Card>

                {parseError && <div className="text-red-500 text-sm mt-1">{parseError}</div>}
              </div>

              <div>
                <h2 className="text-base font-semibold mb-2">Available actions</h2>
                {actions.length > 0 ? (
                  <div className="grid grid-cols-[1fr_auto_2fr_2fr] gap-y-3 text-sm">
                    <div className="text-gray-500 text-xs uppercase">Name</div>
                    <div className="text-gray-500 text-xs uppercase">Method</div>
                    <div className="text-gray-500 text-xs uppercase">Path</div>
                    <div className="text-gray-500 text-xs uppercase">Summary</div>

                    {actions.map((action, index) => (
                      <React.Fragment key={`action-${index}`}>
                        <div className="font-medium">{action.name}</div>
                        <div>{action.method}</div>
                        <div>{action.path}</div>
                        <div className="text-gray-600">{action.summary}</div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {parseError
                      ? 'Unable to parse schema. Please check the format and try again.'
                      : 'No actions available. Add paths to your schema to see actions here.'}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t flex justify-end gap-2">
              <Button variant="outline" className="rounded-full px-4 py-1 h-auto" onClick={onClose}>
                Cancel
              </Button>
              <Button className="rounded-full px-4 py-1 h-auto" onClick={handleSave}>
                Save API
              </Button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>

      {/* Confirmation Dialog for replacing schema */}
      <DialogRoot open={confirmDialogOpen}>
        <Dialog className="sm:max-w-md rounded-xl" onClose={() => setConfirmDialogOpen(false)}>
          <div className="p-6 pb-2">
            <DialogTitle>Replace Schema Content?</DialogTitle>
            <DialogDescription>
              The text area already contains content. Do you want to replace it with the example schema?
            </DialogDescription>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <Button variant="outline" className="rounded-full px-6" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full px-6"
              onClick={() => {
                setSchemaContent(exampleSchema);
                setConfirmDialogOpen(false);
              }}
            >
              Replace
            </Button>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
