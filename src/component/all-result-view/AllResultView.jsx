import React, {Fragment} from 'react';
import moment from 'moment';
import AmCharts from '@amcharts/amcharts3-react';

import LeftNav from '../common/left-nav/LeftNav';
import LoadingScreen from '../common/loading-screen/LoadingScreen';
import NavContainer from '../common/nav-container/NavContainer';
import MapContainer from '../common/map-container/MapContainer';
import jobApi from '../../api/jobApi';

import * as AppConstants from '../../constants/AppConstants';
import * as Config from '../../config/config';
import * as UIHelper from '../../common/UIHelper';
import * as MessageConstants from '../../constants/MessageConstants';

/* eslint-disable no-unused-vars */
import Styles from './AllResultViewStyles.less';
/* eslint-enable no-unused-vars */

class AllResultView extends React.Component {
    constructor(props) {
        super(props);

        this.getAllJobs           = this.getAllJobs.bind(this);
        this.redirectToSiteLoad   = this.redirectToSiteLoad.bind(this);
        this.chartDropDownClick   = this.chartDropDownClick.bind(this);
        this.getArrangedBarChartData = this.getArrangedBarChartData.bind(this);
        this.redirectToAddJob     = this.redirectToAddJob.bind(this);
        this.leftNavStateUpdate   = this.leftNavStateUpdate.bind(this);
        // Setting initial state objects
        this.state  = this.getInitialState();
    }

    componentDidMount() {
        document.title = 'Results View - ' + AppConstants.PRODUCT_NAME;
        document.getElementById("background-video").style.display = 'none';
    }

    componentWillMount() {

        var siteLoginCookie = UIHelper.getCookie(AppConstants.SITE_LOGIN_COOKIE);

        if (siteLoginCookie) {
            var loggedUserObject = JSON.parse(siteLoginCookie);
            this.setState({loggedUserObj: loggedUserObject});
            this.getLoggedUserData(loggedUserObject);
        } else {
            UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);
        }

        this.setState({isLeftNavCollapse: UIHelper.getLeftState()});
    }

    // Returns initial props
    getInitialState() {
        var initialState = {
            isLoading: false,
            loadingMessage: '',
            loggedUserObj: null,
            jobsWithResults: [],
            locationMarker: [],
            isLeftNavCollapse: false,
            selectedTenant: {userList: []}
        };

        return initialState;
    }

    getLoggedUserData(loggedUserObj) {
        UIHelper.getUserData(loggedUserObj, this, this.getAllTenantsData);
    }

    getAllTenantsData(user, context) {
        UIHelper.getAllTenantsData(user, context, context.getAllJobs);
    }

    getAllJobs(loggedUserObj, selectedTenant, context) {
        var urlToGetJobs = Config.API_URL + AppConstants.JOBS_GET_WITH_RESULTS_API;

        context.setState({isLoading: true, loadingMessage: MessageConstants.FETCHING_JOBS});
        var objectToRetrieve = {
            tenantID: selectedTenant._id
        };
        jobApi.getAllJobsFrom(urlToGetJobs, objectToRetrieve).then((data) => {
            var jobsList = [];

            for (let job of data.jobsList) {
                jobsList.push({
                    job: job,
                    result: job.result,
                    selectedChart: AppConstants.CHART_TYPES_ARRAY[0],
                    selectedChartIndex: '0',
                    barChartData: context.getArrangedBarChartData(job, 0)
                })
            }

            var locationsArr = [];

            for (let location of data.locations) {
                locationsArr.push({
                    svgPath: AppConstants.TARGET_SVG,
                    zoomLevel: 5,
                    scale: 2,
                    title: location.textValue,
                    latitude: location.latitude,
                    longitude: location.longitude
                })
            }

            context.setState({isLoading: false, loadingMessage: '', jobsWithResults: jobsList,locationMarker: locationsArr});
        });
    }

    getArrangedBarChartData(job, selectedChartIndex) {
        var resultArray = [];

        if (job.result.length === 0) {
            resultArray.push({
                execution: moment().format(AppConstants.TIME_ONLY_FORMAT),
                responseTime: 0,
                color: '#eb00ff',
                resultID: -1
            });
        }

        for (let currentJob of job.result) {

            if (job.testType === AppConstants.PERFORMANCE_TEST_TYPE) {

                // Check Result ID exists
                var isResultIdFound = resultArray.find(function(jobObj) {
                    return jobObj.resultID === currentJob.resultID;
                });

                if (!isResultIdFound) {
                    resultArray.push({
                        execution: moment(currentJob.time).format(AppConstants.TIME_ONLY_FORMAT),
                        responseTime: currentJob[AppConstants.CHART_TYPES_ARRAY[selectedChartIndex].value]/1000,
                        color: '#eb00ff',
                        resultID: currentJob.resultID
                    });
                }

            } else if (job.testType === AppConstants.PING_TEST_TYPE) {
                resultArray.push({
                    execution: moment(currentJob.time).format(AppConstants.TIME_ONLY_FORMAT),
                    responseTime: currentJob.response/1000,
                    color: '#eb00ff',
                    resultID: currentJob.resultID
                });
            }


        }

        return resultArray;
    }

    chartDropDownClick(jobIndex, jobWithResult, selectedChartIndex) {
        var jobsList = this.state.jobsWithResults;
        jobWithResult.selectedChartIndex = selectedChartIndex;
        jobWithResult.selectedChart = AppConstants.CHART_TYPES_ARRAY[selectedChartIndex];
        jobWithResult.barChartData = this.getArrangedBarChartData(jobWithResult, selectedChartIndex);
        // Remove old job and add updated job
        jobsList.splice(jobIndex, 1, jobWithResult);
        this.setState({jobsWithResults: jobsList});
    }

    redirectToSiteLoad() {
        UIHelper.redirectTo(AppConstants.SITELOAD_ROUTE,
            {
                userObj: JSON.stringify(this.state.loggedUserObj)
            });
    }

    redirectToAddJob() {
        UIHelper.redirectTo(AppConstants.SITEADD_ROUTE, {});
    }

    leftNavStateUpdate() {
        this.setState({isLeftNavCollapse: !this.state.isLeftNavCollapse});
    }

    render() {
        const {
            isLoading,
            loadingMessage,
            loggedUserObj,
            jobsWithResults,
            locationMarker,
            isLeftNavCollapse
        } = this.state;

        const ResultViewContainer = (props) => {
            const {barChartData} = props.jobWithResult;
            const barChartConfig = {
                color: '#fff',
                type: 'serial',
                theme: 'light',
                dataProvider: barChartData,
                valueAxes: [
                    {
                        gridColor: '#FFFFFF',
                        gridAlpha: 0.2,
                        dashLength: 0
                    }
                ],
                gridAboveGraphs: true,
                startDuration: 1,
                graphs: [
                    {
                        balloonText: '[[category]]: <b>[[value]]</b>',
                        fillAlphas: 0.8,
                        lineAlpha: 0.2,
                        type: 'column',
                        valueField: 'responseTime',
                        fillColorsField: 'color'
                    }
                ],
                chartCursor: {
                    categoryBalloonEnabled: false,
                    cursorAlpha: 0,
                    zoomable: false
                },
                categoryField: 'execution',
                categoryAxis: {
                    gridPosition: 'start',
                    gridAlpha: 0,
                    tickPosition: 'start',
                    tickLength: 20
                },
                export: {
                    enabled: true
                }
            };

            var lastTestAvg = barChartData[barChartData.length-1] && barChartData[barChartData.length-1].responseTime;

            const pieChartConfig = {
                type: 'pie',
                theme: 'light',
                outlineAlpha: 0.7,
                outlineColor: '#343242',
                labelsEnabled: false,
                dataProvider: [
                    {
                        title: 'Average Response Time',
                        value: 3
                    },
                    {
                        title: 'Last Test Average',
                        value: lastTestAvg
                    }
                ],
                colors: [
                    '#222029', '#eb00ff'
                ],
                titleField: 'title',
                valueField: 'value',
                labelRadius: 5,
                radius: '42%',
                innerRadius: '70%',
                labelText: '[[title]]',
                export: {
                    enabled: true
                }
            };

            return (
                <div className="row single-chart">
                    <div className="row">
                        <div className="col-sm-4">
                            {
                                (props.jobWithResult.result.length > 0 && props.jobWithResult.testType === AppConstants.PERFORMANCE_TEST_TYPE)
                                    ? <select className="form-control form-control-sm form-group chart-drop-down"
                                        value={props.jobWithResult.selectedChartIndex}
                                        onChange={(e) => this.chartDropDownClick(
                                            props.keyID,
                                            props.jobWithResult,
                                            e.target.value)
                                        }>
                                        {
                                            AppConstants.CHART_TYPES_ARRAY.map((chartType, i) => {
                                                return (
                                                    <option key={'chartType_' + i} value={i}>
                                                        {chartType.textValue}
                                                    </option>
                                                );
                                            })
                                        }
                                      </select>
                                    : null
                            }
                        </div>
                        <div className="col-sm-3">
                            <h4 className="job-name-div">
                                Job Name : {props.jobWithResult.job.jobName}
                            </h4>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-4">
                            <div className="row">
                                <AmCharts.React style={{width: '100%', height: '270px'}} options={pieChartConfig}/>
                            </div>
                            <div className="row pie-chart-heading">
                                Last Test Average
                            </div>
                        </div>
                        <div className="col-sm-8">
                            <AmCharts.React style={{width: '100%', height: '300px'}} options={barChartConfig}/>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <Fragment>
                <LoadingScreen isDisplay={isLoading} message={loadingMessage}/>
                {
                    (loggedUserObj)
                        ? <NavContainer
                                  loggedUserObj={loggedUserObj}
                                  isFixedNav={true}
                                  leftNavStateUpdate={this.leftNavStateUpdate}/>
                        : <div className="sign-in-button">
                              <button onClick={() => {UIHelper.redirectTo(AppConstants.LOGIN_ROUTE);}}
                                  className="btn btn-primary btn-sm log-out-drop-down--li--button">
                                  Sign in
                              </button>
                          </div>
                }
                <LeftNav
                    selectedIndex={AppConstants.ALL_RESULT_VIEW_INDEX}
                    leftNavStateUpdate={this.leftNavStateUpdate}/>
                <div className={
                        'all-result-view ' +
                        ((isLeftNavCollapse) ? 'collapse-left-navigation' : 'expand-left-navigation')}>
                    {
                        (locationMarker.length > 0)
                            ? <div className="row map-container">
                                  <MapContainer height="100%" width="100%" locationMarker={locationMarker}/>
                              </div>
                            : <MapContainer height="100%" width="100%" locationMarker={[]}/>
                    }
                    <div className="row chart-view">
                        {
                            (jobsWithResults.length > 0)
                                ? jobsWithResults.map((jobWithResult, i) => {
                                    return <ResultViewContainer jobWithResult={jobWithResult} keyID={i}/>;
                                })
                                : null
                        }
                    </div>
                    {
                        (loggedUserObj.permissions && loggedUserObj.permissions.canCreate)
                            ? <div className="row" id="add-test-section">
                                <div className="col-sm-4"></div>
                                <div className="col-sm-4 add-test-text" onClick={this.redirectToAddJob}>
                                    <div className="row">
                                        Add a test
                                    </div>
                                    <div className="row">
                                        <i className="plus-icon glyphicon glyphicon-plus"></i>
                                    </div>
                                </div>
                                <div className="col-sm-4"></div>
                              </div>
                            : null
                    }

                </div>
            </Fragment>
        );
    }
}

AllResultView.propTypes = {
};

export default AllResultView;
